# TASK: SCHEDULE CHECK
Date: {{DATE}}

## CONTEXT
Runtime context (calendar data expected here): {{CONTEXT}}

## INSTRUCTIONS
1. Read today's events from the runtime context (ingested via n8n / Google Calendar).
2. Summarize the day: next event, total meeting load, and any free blocks.
3. Do NOT write a file unless the context asks for it — this is a quick read-back skill.

## CONSTRAINTS
- Read-only. Do not modify the vault.
- End stdout with a 1-2 sentence spoken summary for the TTS engine.
