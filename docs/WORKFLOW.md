# GStack Multi-Persona Workflow

## How It Works

Work in GStack happens through **files, not conversations**. Every plan, decision, and review is written to a file so that any persona can pick it up in any conversation.

## Directory Structure

```
docs/
  personas/       # Persona definitions (who reviews what, and how)
  plans/          # Proposals and implementation plans
  reviews/        # Persona reviews of plans
```

## The Flow

### 1. Request work
Tell Claude what you want. Claude writes a plan to `docs/plans/<name>.md`.

### 2. Invoke a persona to review
Open a new conversation (or continue the same one) and say:
> "Review `docs/plans/<name>.md` using the persona in `docs/personas/ceo.md`"

Claude reads both files and writes a review to `docs/reviews/<name>-ceo.md`.

### 3. Invoke more personas
Repeat step 2 with different personas:
> "Review `docs/plans/<name>.md` using the persona in `docs/personas/cto.md`"

### 4. Approve and execute
Once reviews are done, tell Claude to proceed with implementation.

## Example Commands

```
"Plan the retention campaign feature. Write the plan to docs/plans/retention-campaign.md"

"Read docs/plans/retention-campaign.md and review it as the CEO persona (docs/personas/ceo.md). Write review to docs/reviews/retention-campaign-ceo.md"

"Read docs/plans/retention-campaign.md and review it as the CTO persona (docs/personas/cto.md). Write review to docs/reviews/retention-campaign-cto.md"

"All reviews are done. Implement the plan in docs/plans/retention-campaign.md"
```

## Key Principle

**If it's not in a file, it doesn't exist.** Plans, reviews, decisions — everything goes to a file. This means:
- No context is lost between conversations
- Any persona can review any artifact
- You have a full audit trail of decisions
