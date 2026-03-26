# GStack Quick Reference — Eduardo's Cheat Sheet

GStack gives you slash commands to type into Claude Code. Each command turns Claude into a specialist role. You don't need to memorize prompts — just type the command.

---

## Your Daily Workflow Commands

### Starting Work

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/office-hours` | `/office-hours` | Start of a session. Discuss what you want to build, brainstorm ideas, get Claude aligned on your goals. |
| `/autoplan` | `/autoplan` | When you have a task or feature in mind. Claude auto-generates a step-by-step implementation plan. |

### Planning & Review (Before Building)

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/plan-ceo-review` | `/plan-ceo-review` | Review a plan from a CEO lens — is this the right thing to build? Are priorities correct? |
| `/plan-eng-review` | `/plan-eng-review` | Review a plan from an engineering lens — is the approach sound? Any technical risks? |
| `/plan-design-review` | `/plan-design-review` | Review a plan from a design lens — will this look and feel good? |
| `/design-consultation` | `/design-consultation` | Get design advice before building — layout ideas, UX patterns, visual direction. |

### Quality Checks (After Building)

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/review` | `/review` | Full code review — bugs, patterns, quality issues. Use before shipping. |
| `/design-review` | `/design-review` | Review the implemented design — does the UI match the vision? |
| `/qa` | `/qa` | Thorough QA — finds edge cases, broken states, UX issues. |
| `/qa-only` | `/qa-only` | Lighter QA — just test, no code changes. |

### Shipping

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/ship` | `/ship` | End-to-end ship process: review + QA + prepare for merge. The "I'm done, ship it" command. |
| `/land-and-deploy` | `/land-and-deploy` | Merge the PR and deploy to production. |
| `/canary` | `/canary` | Deploy cautiously with monitoring. |

### Safety & Control

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/careful` | `/careful` | Tell Claude to slow down and be extra careful (e.g., before a risky change). |
| `/freeze` | `/freeze` | Lock down — Claude won't make changes until you unfreeze. |
| `/unfreeze` | `/unfreeze` | Resume normal operations after a freeze. |
| `/guard` | `/guard` | Set guardrails — tell Claude what NOT to touch. |

### Other Useful Commands

| Command | What to type | When to use |
|---------|-------------|-------------|
| `/investigate` | `/investigate` | Deep-dive into a bug. Claude traces the issue through the code. |
| `/retro` | `/retro` | After shipping — what went well, what didn't, what to improve. |
| `/document-release` | `/document-release` | Generate release notes for what was shipped. |
| `/cso` | `/cso` | Security review — checks for vulnerabilities. |
| `/benchmark` | `/benchmark` | Performance review — checks for slow code paths. |

---

## Eduardo's Typical Session Flow

```
1. /office-hours          → Align on what to build today
2. /autoplan              → Generate implementation plan
3. /plan-ceo-review       → Sanity check the plan
4. (Claude builds it)
5. /design-review         → Check the visual quality
6. /qa                    → Find edge cases
7. /ship                  → Final review + prepare to merge
8. /land-and-deploy       → Merge and deploy
```

You don't need to use all of these every time. Pick what fits:
- **Small change?** Build it → `/review` → `/ship`
- **Big feature?** `/autoplan` → `/plan-ceo-review` → build → `/design-review` → `/qa` → `/ship`
- **Bug fix?** `/investigate` → fix → `/qa` → `/ship`

---

## Key Thing to Remember

These are **slash commands you type in Claude Code's chat**. They're not settings or configurations — they're prompts that activate specialist behaviors. Claude reads the command, loads the relevant instructions, and shifts into that role for the conversation.
