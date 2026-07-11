# TASK: MORNING BRIEF
Date: {{DATE}}

## CONTEXT
Runtime context (may include calendar + priorities): {{CONTEXT}}

## INSTRUCTIONS
1. Gather today's calendar events and top priorities from the runtime context.
2. Skim `./00_Inbox/` for any unprocessed notes worth surfacing.
3. Compose a concise executive rundown: what today looks like, top 3 priorities,
   and anything urgent.
4. Write the report to `./01_Briefs/{{DATE}}_Morning_Brief.md`.

## OUTPUT FORMAT
---
id: morning-brief-{{DATE}}
type: report
status: unread
source: SKILL_MORNING_BRIEF
tags: [ai-generated, summary, daily]
date: {{DATE}}
---
### Rundown
[Executive summary]

### Top 3 Priorities
1.
2.
3.

## CONSTRAINTS
- Only write inside `01_Briefs`.
- End stdout with a 2-sentence spoken rundown for the TTS engine.
