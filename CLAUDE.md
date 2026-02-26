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
   https://htmlpreview.github.io/?https://github.com/edooai-eduardoteixeira/edooai-demo-v2/blob/<branch>/public/preview-<nome>.html
   ```

3. **Iterar no preview** até o usuário aprovar o visual

4. **Aplicar as mudanças no componente React real** somente após aprovação

5. **Deploy** só acontece quando o usuário pedir explicitamente

## Comunicação

- Falar em português (pt-BR)
- Ser direto e conciso
- Sempre fornecer o link do preview após push
- Não sugerir ações que dependam de terminal ou ambiente local

## Stack do projeto

- React + Vite
- Deploy via Railway
- Repo: edooai-eduardoteixeira/edooai-demo-v2
