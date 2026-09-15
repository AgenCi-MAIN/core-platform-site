# Reaching Claude Code from an iPhone

Recorded 2026-09-15 at the founder's direction. Claude Code does not run
natively on iOS; there is no terminal on the phone that launches it. Three
routes work, in the order to prefer them.

## 1. Claude iOS app (no terminal, no SSH) — preferred

- Open the Claude app, go to the **Code** tab, start a session against
  `agenci-main/core-platform-site`.
- The session runs in a cloud container with a fresh clone of the repo.
  Nothing runs on the phone or on the Windows PC.
- Work lands on a `claude/...` branch with a draft pull request. Merging and
  deploying stay with the founder, per CLAUDE.md ("mi" is per-instance merge
  authorization; deploy is always run from the Windows machine).

## 2. Remote Control from the desktop session (not SSH)

On the Windows machine, from the project directory (every new terminal starts
in `C:\Users\k2547`, so `cd` first):

```powershell
cd <path-to>\core-platform-site
claude --remote-control
```

Inside an already running session, type `/remote-control` instead.

- Claude Code prints a link and QR code. Open it in the Claude iOS app to
  drive that same local session from the phone, with the PC's files and tools.
- The connection is outbound from the PC to Anthropic; no inbound port and no
  SSH server are needed.
- The desktop session must stay running.

## 3. SSH from an iOS terminal app

- Install an SSH client on the phone (Blink Shell, Termius).
- Connect to a machine that has Node and Claude Code installed, then run
  `claude` there. For the Windows dev box that means enabling **OpenSSH
  Server** in Windows settings; a Linux server or Mac also works.
- Run Claude inside `tmux` or `screen` so the session survives the phone's
  connection dropping.

iSH and a-Shell emulate a small Linux on the phone, but Node does not run
reliably in them, so Claude Code cannot be installed there.

## What does not change

- None of these routes bypass the access model. Anything touching `/portal`
  or `/auth` still goes through the tests before a push (CLAUDE.md).
- Secrets are never typed into a phone session or a chat. Only secret names
  appear anywhere.
