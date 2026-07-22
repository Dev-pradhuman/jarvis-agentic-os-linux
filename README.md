# Jarvis Agentic OS — Linux Edition

A local-first desktop workspace for coordinating Claude Code, Codex, Gemini, Perplexity/API providers, MCP servers, project memory, and agent missions. Everything binds to your machine’s loopback interface by default.

> **Linux edition.** On Windows, use [jarvis-agentic-os](https://github.com/Dev-pradhuman/jarvis-agentic-os).

## Start in three steps

1. Install Node.js 20+ and npm. Install whichever agent CLIs you want to use (for example `claude`, `codex`, or `gemini`).
2. Clone this repository, then run:

```bash
git clone https://github.com/Dev-pradhuman/jarvis-agentic-os-linux.git
cd jarvis-agentic-os-linux
chmod +x start.sh
./start.sh
```

3. Open `http://127.0.0.1:5173` if your browser does not open automatically. Complete the first-run setup: choose the folder that contains your projects and decide whether to create a shared Obsidian Brain.

`start.sh` defaults to `~/projects`. To use another location before first launch:

```bash
JARVIS_PROJECTS_ROOT="$HOME/code" ./start.sh
```

The launcher installs Node dependencies on first run, starts the orchestrator on `127.0.0.1:3030`, starts the UI on `127.0.0.1:5173`, and stops both when you press Ctrl+C.

## Choose the right edition

| Your computer | Repository | Start command |
|---|---|---|
| Linux | This repository | `./start.sh` |
| Windows | [jarvis-agentic-os](https://github.com/Dev-pradhuman/jarvis-agentic-os) | `start.bat` |

Both editions include the same Jarvis features: multi-CLI chat, a shared Brain, skills and MCP configuration, approval queue, setup health, usage reporting, and Manual/Automatic missions.

## How to use it

- **Chats:** Open a CLI tile, choose **UI** for Jarvis-managed prompts or **Terminal** for the CLI’s native interactive session.
- **Models and effort:** Use `Auto · CLI default` or choose a model. Claude offers Low/Med/High/Xhigh/Max; Codex offers Low/Med/High. Other providers expose their supported effort range.
- **Shared Brain:** Jarvis writes its local memory under `<projects-root>/.jarvis-brain/` and adds relevant context to each managed run.
- **Missions:** In Operations, create a mission. Manual mode lets you run each stage; Automatic mode advances Research → Plan → Implement → Review → Test after successful stages and pauses on a failure or unavailable agent.

## Optional voice services

Voice features are optional. To run local STT/TTS services, create a Python virtual environment and install the ML requirements:

```bash
cd ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python stt_service.py &
python tts_service.py &
```

## Development and verification

```bash
npm --prefix orchestrator test
npm --prefix frontend run build
```

## Security note

Jarvis deliberately runs selected CLIs with broad tool permissions inside the project folder you choose. Keep the services bound to localhost, use a dedicated projects directory, and do not expose the orchestrator port to a network without adding authentication.
