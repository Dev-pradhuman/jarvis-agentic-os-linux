# TASK: DEEP RESEARCH PIPELINE
Date: {{DATE}}
Topic: "{{CONTEXT.topic}}"

## INSTRUCTIONS
You have access to local CLI tools (curl, grep, Python scripts). Execute strictly:
1. Discovery: run `python3 scripts/search.py "{{CONTEXT.topic}}"` to find the top 3
   relevant articles from the last month.
2. Extraction: read the content of those 3 URLs.
3. Synthesis: write a comprehensive research brief — technical accuracy, key players,
   actionable takeaways.
4. Storage: save to `./03_Resources/Research_{{CONTEXT.topic}}.md` with YAML frontmatter.
5. TTS Output: print a 2-sentence summary to stdout ending with
   "Research complete. The brief is in your vault."

## OUTPUT FRONTMATTER
---
id: research-{{DATE}}
type: research
status: unread
source: SKILL_DEEP_RESEARCH
tags: [research, ai-generated]
date: {{DATE}}
---

## CONSTRAINTS
- Do NOT ask for user input. Make logical assumptions if data is missing.
- Limit execution to 3 tool calls. If no data found after 3 attempts, write a failure
  report to `./03_Resources/` and exit.
- Only write inside `03_Resources`.
