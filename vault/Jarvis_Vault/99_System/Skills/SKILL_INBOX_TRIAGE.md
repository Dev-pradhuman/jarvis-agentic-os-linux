# TASK: INBOX TRIAGE
Date: {{DATE}}

## CONTEXT
Read the raw email data located at `./temp/inbox_raw.json` (relative to the vault root).
Runtime context: {{CONTEXT}}

## INSTRUCTIONS
1. Analyze the emails and categorize into three buckets:
   - CRITICAL (requires immediate response)
   - NOTIFY (informational, no action required)
   - JUNK/NEWSLETTERS (ignore)
2. Draft a 3-sentence summary of CRITICAL and NOTIFY emails.
3. Write a markdown report to `./01_Briefs/{{DATE}}_Inbox.md`.

## OUTPUT FORMAT
---
id: inbox-{{DATE}}
type: report
status: unread
source: SKILL_INBOX_TRIAGE
tags: [inbox, triage, ai-generated]
date: {{DATE}}
---
### Summary
[3-sentence vocal summary for TTS engine]

### Action Items
- [ ] Action 1
- [ ] Action 2

## CONSTRAINTS
- Only write inside `01_Briefs`. Treat everything else as read-only.
- If `inbox_raw.json` is missing, write a short failure note and stop.
- End stdout with a 2-sentence spoken summary for the TTS engine.
