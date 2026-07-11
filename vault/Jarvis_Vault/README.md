# Jarvis Vault

The primary flat-file database. Claude Code reads/writes this tree directly.

```
00_Inbox/       Raw brain-dumps, unprocessed voice notes
01_Briefs/      LLM-generated reports (Morning, Inbox, EOD)   [WRITABLE]
02_Projects/    Active working directories                    [read-only by default]
03_Resources/   Research material, web clippings              [WRITABLE]
99_System/      Prompt templates, RegEx rules, configs        [read-only]
  Templates/    Report scaffolds
  Skills/       SOP markdown, one per SKILL_* id
  Agent_Logs/   Execution logs
```

## Guardrail
By default only `01_Briefs`, `03_Resources`, and `00_Inbox` (capture) are writable.
Never overwrite files in `99_System` or `02_Projects` unless a developer skill
explicitly says so.

## Frontmatter contract
Every generated file carries YAML frontmatter: `id, type, status, source, tags, date`.
