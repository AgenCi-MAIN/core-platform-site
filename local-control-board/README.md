# Local Vera control board

Small loopback web app for worker lanes and a local assignment queue.

```
python server.py
```

Then open `http://localhost:5000/`. Binds `127.0.0.1:5000` only.

This is not the Cloudflare Worker, not a live membership read, and not a
deploy. Assignments are stored in `data/assignments.json` on this machine
and default to this Cursor cloud agent.
