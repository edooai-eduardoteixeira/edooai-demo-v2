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
