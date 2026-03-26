# CLAUDE.md — Instruções para o Claude Code

## Sobre o usuário

- O usuário (Eduardo) **não usa terminal** e **não roda nada localmente**.
- Ele só visualiza código em produção (Railway) ou pelo GitHub.
- Nunca assuma que ele pode rodar `npm run dev`, abrir localhost, ou usar CLI.

## Processo de iteração visual

Quando o usuário pedir mudanças visuais em um componente:

1. **Criar/atualizar um preview HTML estático** em `public/preview-<nome>.html`
   - Arquivo standalone (HTML + CSS inline, sem dependências externas)
   - Deve replicar fielmente o visual do componente React correspondente
   - Usar dados fictícios mas realistas

2. **Fazer push para a branch** e fornecer o link de visualização:
   ```
   https://htmlpreview.github.io/?https://github.com/eduardofteixeira/demo-v2/blob/<branch>/public/preview-<nome>.html
   ```

3. **Iterar no preview** até o usuário aprovar o visual

4. **Aplicar as mudanças no componente React real** somente após aprovação

5. **Deploy** só acontece quando o usuário pedir explicitamente

## Comunicação

- Ser direto e conciso
- Sempre fornecer o link do preview após push
- Não sugerir ações que dependam de terminal ou ambiente local

## Multi-Persona Workflow (GStack)

When the user requests a plan, proposal, or any work that will need review by different personas:

1. **Always write the plan to a file** in `docs/plans/<name>.md` — never keep it only in conversation
2. **Persona definitions** live in `docs/personas/` — read them when asked to review as a specific persona
3. **Write reviews to files** in `docs/reviews/<name>-<persona>.md`
4. **Don't implement** until the user explicitly says to proceed after reviews

This enables the user to invoke different personas across conversations without losing context. See `docs/WORKFLOW.md` for the full process.

## Design System

Follow the design system rules in `DESIGN_GUIDELINES.md` exactly. Never improvise CSS values — use only the tokens and patterns defined there.

Key rules:
- **No raw hex colors** for text, backgrounds, borders, or accents — always use CSS variables from `src/styles/global.css`
- **No invented spacing values** — only use the allowed scale (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 80px)
- **No hardcoded shadows** — use `var(--shadow-xs)` through `var(--shadow-xl)`
- **No inline transition durations** — use `var(--transition-fast)`, `var(--transition-base)`, or `var(--transition-slow)`
- Platform brand colors in `PLATFORM_COLORS` are the only exception to the "no raw hex" rule
