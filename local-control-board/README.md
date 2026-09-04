# Local five-lane board

One loopback app. Canonical URL:

```
http://localhost:5000/
```

`127.0.0.1:5000` is the same process. Bind is `127.0.0.1` only.

```
python server.py
```

Not the Cloudflare Worker, not live membership, not a deploy. Queue JSON lives in
`data/assignments.json`. Lane 1 numbers are snapshot facts, not infra gauges.
