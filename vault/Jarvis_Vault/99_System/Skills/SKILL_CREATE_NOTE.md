# TASK: CREATE NOTE
Date: {{DATE}}

## CONTEXT
The thought to capture is in the runtime context: {{CONTEXT}}
Look for a `text` (or `topic`) field holding the note body.

## INSTRUCTIONS
1. Take the captured thought and give it a short, descriptive title.
2. Write it to `./00_Inbox/{{DATE}}_note.md` with YAML frontmatter.

## OUTPUT FORMAT
---
id: note-{{DATE}}
type: note
status: unprocessed
source: SKILL_CREATE_NOTE
tags: [inbox, capture]
date: {{DATE}}
---
### [Title]
[Note body]

## CONSTRAINTS
- Only write inside `00_Inbox`.
- End stdout with a 1-sentence confirmation for the TTS engine.
