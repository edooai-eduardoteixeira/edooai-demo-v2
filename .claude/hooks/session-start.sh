#!/bin/bash
set -euo pipefail

# Only run in remote (cloud) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install npm dependencies
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  cd "$CLAUDE_PROJECT_DIR"
  npm install --prefer-offline 2>/dev/null || npm install
fi

# Install Bun (required by Gstack)
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  echo "export BUN_INSTALL=\"\$HOME/.bun\"" >> "$CLAUDE_ENV_FILE"
  echo "export PATH=\"\$BUN_INSTALL/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

# Install Gstack if not already present
if [ ! -d ~/.claude/skills/gstack ]; then
  git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
  cd ~/.claude/skills/gstack
  # Full setup: builds browse binary, installs Playwright, creates symlinks.
  # May fail in cloud environments where Playwright CDN is blocked — that's OK,
  # gstack-relink below handles symlink creation independently.
  echo "1" | ./setup || true
fi

# Ensure skill symlinks exist (setup may have exited before creating them)
if [ -d ~/.claude/skills/gstack ] && [ -x ~/.claude/skills/gstack/bin/gstack-relink ]; then
  ~/.claude/skills/gstack/bin/gstack-relink 2>/dev/null || true
fi

# ─── Cloud browse fixes ──────────────────────────────────────────
# The cloud container has three issues that prevent gstack browse from working:
#   1. Playwright Chromium may not be installed (CDN flaky through proxy)
#   2. Runs as root → needs --no-sandbox
#   3. Egress proxy with TLS interception breaks Playwright's page.goto()
#      and the compiled Bun CLI routes localhost traffic through the proxy
#
# Fix: install Chromium, patch the server for proxy+sandbox, and replace
# the CLI binary with a shell wrapper that talks directly to the server.

GSTACK_DIR="$HOME/.claude/skills/gstack"
BROWSE_DIST="$GSTACK_DIR/browse/dist"

if [ -d "$GSTACK_DIR" ]; then
  # 1. Ensure Playwright Chromium is installed
  CHROMIUM_OK=0
  cd "$GSTACK_DIR"
  if bun --eval 'import { chromium } from "playwright"; const b = await chromium.launch({ args: ["--no-sandbox"] }); await b.close();' >/dev/null 2>&1; then
    CHROMIUM_OK=1
  fi

  if [ "$CHROMIUM_OK" -eq 0 ]; then
    echo "[session-start] Installing Playwright Chromium..."
    cd "$GSTACK_DIR"
    bunx playwright install chromium 2>/dev/null || npx playwright install chromium 2>/dev/null || true
  fi

  # 2. Patch browser-manager.ts for proxy + sandbox support
  BROWSER_MGR="$GSTACK_DIR/browse/src/browser-manager.ts"
  if [ -f "$BROWSER_MGR" ] && ! grep -q "Proxy support: parse HTTP" "$BROWSER_MGR"; then
    echo "[session-start] Patching browser-manager for proxy support..."
    # Add proxy detection after the CONTAINER/CI sandbox block
    sed -i '/if (process\.env\.CI || process\.env\.CONTAINER) {/{
      N; s/}$/}\
\
    \/\/ Proxy support: parse HTTP(S)_PROXY env vars for environments behind\
    \/\/ an egress proxy (e.g. containerized CI with JWT-authenticated proxies).\
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;\
    let proxyConfig: { server: string; username?: string; password?: string } | undefined;\
    if (proxyUrl) {\
      const proxyMatch = proxyUrl.match(\/^https?:\\\/\\\/([^:]+):([^@]+)@([^:]+):(\\d+)$\/);\
      if (proxyMatch) {\
        proxyConfig = {\
          server: \`http:\/\/${proxyMatch[3]}:${proxyMatch[4]}\`,\
          username: proxyMatch[1],\
          password: proxyMatch[2],\
        };\
      } else {\
        proxyConfig = { server: proxyUrl };\
      }\
      launchArgs.push('\''--ignore-certificate-errors'\'');\
      console.log(\`[browse] Using proxy: ${proxyConfig.server}\`);\
    }/
    }' "$BROWSER_MGR"

    # Add proxy to chromium.launch()
    sed -i 's/\.\.\.(launchArgs\.length > 0 ? { args: launchArgs } : {}),$/\.\.\.(launchArgs.length > 0 ? { args: launchArgs } : {}),\n      ...(proxyConfig ? { proxy: proxyConfig } : {}),/' "$BROWSER_MGR"

    # Add ignoreHTTPSErrors to context
    sed -i 's/viewport: { width: 1280, height: 720 },$/viewport: { width: 1280, height: 720 },\n      ...(proxyConfig ? { ignoreHTTPSErrors: true } : {}),/' "$BROWSER_MGR"
  fi

  # 3. Also auto-detect root user and add --no-sandbox without CONTAINER env
  if [ -f "$BROWSER_MGR" ] && ! grep -q "process.getuid" "$BROWSER_MGR"; then
    sed -i 's/if (process\.env\.CI || process\.env\.CONTAINER) {/if (process.env.CI || process.env.CONTAINER || (typeof process.getuid === "function" \&\& process.getuid() === 0)) {/' "$BROWSER_MGR"
  fi

  # 4. Rebuild the Node server bundle with patches applied
  if [ -x "$GSTACK_DIR/browse/scripts/build-node-server.sh" ]; then
    echo "[session-start] Rebuilding browse server bundle..."
    cd "$GSTACK_DIR"
    bash browse/scripts/build-node-server.sh 2>/dev/null || true
  fi

  # 5. Replace compiled browse CLI with shell wrapper
  #    The compiled Bun binary routes localhost fetch() through the egress proxy,
  #    causing timeouts. Playwright's page.goto() also hangs through TLS-intercepting
  #    proxies. The wrapper uses curl (which respects NO_PROXY) and JS navigation.
  echo "[session-start] Installing browse CLI wrapper..."
  # Back up original if not already backed up
  [ -f "$BROWSE_DIST/browse.bak" ] || cp "$BROWSE_DIST/browse" "$BROWSE_DIST/browse.bak" 2>/dev/null || true

  cat > "$BROWSE_DIST/browse" << 'BROWSE_WRAPPER'
#!/bin/bash
# gstack browse CLI wrapper for cloud containers
# Replaces the compiled Bun binary to work around:
#   - Bun fetch() routing localhost through egress proxy
#   - Playwright page.goto() hanging through TLS-intercepting proxies
# The wrapper talks to the server via curl and uses JS-based navigation.

STATE_FILE="${BROWSE_STATE_FILE:-$(pwd)/.gstack/browse.json}"
SERVER_SCRIPT="$HOME/.claude/skills/gstack/browse/dist/server-node.mjs"

# ─── Server lifecycle ────────────────────────────────────────────
read_state() {
  [ -f "$STATE_FILE" ] || return 1
  PORT=$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['port'])" 2>/dev/null) || return 1
  TOKEN=$(python3 -c "import json; print(json.load(open('$STATE_FILE'))['token'])" 2>/dev/null) || return 1
  [ -n "$PORT" ] && [ -n "$TOKEN" ]
}

is_healthy() {
  curl -sf --max-time 2 "http://127.0.0.1:$PORT/health" > /dev/null 2>&1
}

start_server() {
  [ -f "$SERVER_SCRIPT" ] || { echo "[browse] Server bundle not found: $SERVER_SCRIPT" >&2; exit 1; }
  rm -f "$STATE_FILE" "${STATE_FILE}.lock"
  mkdir -p "$(dirname "$STATE_FILE")"

  # Start server — CONTAINER=1 enables --no-sandbox for root
  CONTAINER=1 nohup node "$SERVER_SCRIPT" > /dev/null 2>&1 &
  local srv_pid=$!
  disown $srv_pid 2>/dev/null || true

  # Wait for server to become healthy (up to 15s)
  for i in $(seq 1 30); do
    if read_state && is_healthy; then
      return 0
    fi
    sleep 0.5
  done
  echo "[browse] Server failed to start within 15s" >&2
  return 1
}

ensure_server() {
  if read_state && is_healthy; then
    return 0
  fi
  echo "[browse] Starting server..." >&2
  start_server
}

# ─── Command dispatch ────────────────────────────────────────────
send_cmd() {
  local cmd="$1" args_json="$2"
  curl -sf --max-time 30 \
    "http://127.0.0.1:$PORT/command" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"command\":\"$cmd\",\"args\":$args_json}" 2>&1
}

# ─── Main ────────────────────────────────────────────────────────
[ $# -ge 1 ] || { echo "Usage: browse <command> [args...]" >&2; exit 1; }
COMMAND="$1"; shift

# Ensure server is running
ensure_server || exit 1

# status — read from health endpoint
if [ "$COMMAND" = "status" ]; then
  HEALTH=$(curl -sf "http://127.0.0.1:$PORT/health" -H "Authorization: Bearer $TOKEN")
  echo "$HEALTH" | python3 -c "
import json,sys
h=json.load(sys.stdin)
print(f'Status: {h[\"status\"]}')
print(f'Mode: {h[\"mode\"]}')
print(f'URL: {h[\"currentUrl\"]}')
print(f'Tabs: {h[\"tabs\"]}')
pid_line = ''
try:
  import os; pid_line = f'\nPID: {h.get(\"pid\", \"unknown\")}'
except: pass
" 2>/dev/null
  exit 0
fi

# goto — JS navigation (page.goto hangs through TLS-intercepting proxies)
if [ "$COMMAND" = "goto" ]; then
  URL="$1"
  [ -n "$URL" ] || { echo "Usage: browse goto <url>" >&2; exit 1; }
  JS_ARGS=$(python3 -c "import json,sys; print(json.dumps(['window.location.href='+json.dumps(sys.argv[1])]))" "$URL")
  send_cmd "js" "$JS_ARGS" > /dev/null 2>&1
  for i in $(seq 1 24); do
    sleep 0.5
    CUR=$(curl -sf "http://127.0.0.1:$PORT/health" -H "Authorization: Bearer $TOKEN" 2>/dev/null \
      | python3 -c "import json,sys; print(json.load(sys.stdin).get('currentUrl',''))" 2>/dev/null)
    if [ -n "$CUR" ] && [ "$CUR" != "about:blank" ]; then
      sleep 1  # let content render
      echo "Navigated to $URL ($CUR)"
      exit 0
    fi
  done
  echo "Navigated to $URL (timeout)" >&2; exit 1
fi

# back/forward/reload — JS navigation
if [ "$COMMAND" = "back" ]; then
  send_cmd "js" "[\"history.back(); 'ok'\"]" > /dev/null
  sleep 1; echo "Back → $(send_cmd "url" "[]")"; exit 0
fi
if [ "$COMMAND" = "forward" ]; then
  send_cmd "js" "[\"history.forward(); 'ok'\"]" > /dev/null
  sleep 1; echo "Forward → $(send_cmd "url" "[]")"; exit 0
fi
if [ "$COMMAND" = "reload" ]; then
  send_cmd "js" "[\"location.reload(); 'ok'\"]" > /dev/null
  sleep 2; echo "Reloaded $(send_cmd "url" "[]")"; exit 0
fi

# stop — forward to server then clean up
if [ "$COMMAND" = "stop" ]; then
  send_cmd "stop" "[]" 2>/dev/null
  rm -f "$STATE_FILE"
  echo "Server stopped"; exit 0
fi

# All other commands — forward directly to server
ARGS_JSON=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1:]))" "$@")
RESPONSE=$(send_cmd "$COMMAND" "$ARGS_JSON")
EXIT=$?

if [ $EXIT -ne 0 ]; then
  echo "[browse] Command failed" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

# Surface JSON errors
ERR=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); e=d.get('error',''); print(e) if e else sys.exit(1)" 2>/dev/null) && {
  echo "$ERR" >&2
  HINT=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); h=d.get('hint',''); print(h) if h else sys.exit(1)" 2>/dev/null) && echo "$HINT" >&2
  exit 1
}

echo "$RESPONSE"
BROWSE_WRAPPER
  chmod +x "$BROWSE_DIST/browse"

  echo "[session-start] Browse cloud fixes applied."
fi
