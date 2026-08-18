# The board presentation — what was made, and why

Four pieces, built 2026-08-14 for the CEO board. The HTML files here are the
sources; each was also published as a private artifact on claude.ai. Every file
is self-contained — open it in a browser, no build step, no network.

**Design brief, all four:** a board making funding and authority decisions is
the audience. Persuasion here comes from being checkable, not from being
impressive. So the same rule runs through everything: what is running today is
stated as fact, what is planned is labelled as planned, and what the technology
cannot do is said out loud rather than left for someone to discover in the room.

---

## 01 · The pitch — `01-pitch-seventy-two-hours.html`

Twelve full-screen moments, click to advance, with an opening choice: JARVIS
narrates it aloud and lights each line as it reads, or you read it yourself in
silence.

**This is the one to open with.** It carries the argument in the fewest words.

The narrative turns on a real event: on day three we found that identity was
being taken from a request header, which meant anyone who knew an owner's email
address could have been admitted as that owner. It was closed the same day, and
two test suites now fail the build if it ever reopens.

**Why lead with the flaw.** A three-day-old system claiming to be ahead invites
a board to argue. A three-day-old system that found a hole most companies meet
through a breach, closed it, and wrote tests so it cannot reopen, makes the same
claim without asserting it. The most persuasive moment in the deck is the one
that concedes something: *"No. It does not run the business without you."*

**Design.** Committed single dark theme — an ember in a dark room. Void ground,
one true ember accent that blooms, gold reserved for numerals, and THRIVE's
crimson held back for exactly one moment (the security finding), which is why
that moment lands. Large serif statements against monospace labels tracked wide
like inscriptions. Motion is slow and scarce: embers rising, a core breathing.
Restraint is what makes it read as considered rather than flashy.

## 02 · The board deck — `02-board-deck.html`

Sixteen slides, click or arrow keys, a dot rail for jumping. The detailed
version: five-layer build-out of the portal, the Salesforce-versus-build
comparison with a recommendation, iOS in two phases, rank-versus-role access
with a capability matrix, and API grants for agents.

**Use it second** — when the board starts asking harder questions than the pitch
answers.

**Design.** Deep navy instrument panel, signal amber accent, semantic teal and
rust reserved strictly for allow and deny states. Monospace headlines against a
Georgia body — a technical dossier rather than a sales deck. Hairline grid
backdrop, scroll-snap slides.

## 03 · The spoken briefing — `03-spoken-briefing.html`

Thirteen beats narrated aloud by the browser, with a reactive core that pulses
in time with the speech and captions that highlight as they are read.

Screen-record it (`Win + Alt + R`) to produce an actual video file.

**On the voice.** Quality is almost entirely voice *selection*, not parameters.
Windows' built-in David and Zira are formant synthesizers and sound it. Edge
exposes Microsoft's *neural* voices to web pages — the code prefers those,
British male first, and stops flattening pitch when it finds one, since neural
voices carry their own cadence and pushing them off-neutral makes them sound
processed. For something indistinguishable from the films, run
`narration-script.txt` through ElevenLabs.

## 04 · Portal 2.0 concept — `04-portal-2.0-concept.html`

A design concept for the live portal, opening with a "who we are" introduction
to THRIVE itself, then the redesigned command surface.

Built against the actual deployed portal, so it maps onto what exists — same
sidebar groups, same tiles, Call Lab and Quoter and Script Vault included.

**Three changes worth defending:**

1. **Gold means one thing.** In the current portal gold appears on the Owner
   medallion; in 2.0 it is reserved exclusively for rank and standing, never
   decoration. Standing becomes visible at a glance instead of read.
2. **Capability becomes countable.** "10 / 10" is a number; the ring lists all
   ten grants by name. What you hold is the reason you get in, so it should be
   legible.
3. **Connection states stay honest, everywhere.** The current dashboard already
   says "Not connected — CRM, carrier, dialer feeds and financial data stay
   absent," and it is the most trustworthy thing on the page. 2.0 makes that a
   system-wide pattern rather than one red card.

## `narration-script.txt`

The JARVIS narration in full, roughly four minutes spoken. Feeds any
text-to-speech engine. To synthesize locally on Windows:

```powershell
Add-Type -AssemblyName System.Speech
$v = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v.SelectVoice('Microsoft David Desktop')   # see GetInstalledVoices() for options
$v.Rate = -1
$v.SetOutputToWaveFile('C:\MAINBACK\jarvis-brief.wav')
$v.Speak([IO.File]::ReadAllText('C:\MAINBACK\jarvis-script.txt'))
$v.Dispose()
```

---

## Two things the presentation states that should not be quietly dropped

**The sidebar names are not the route names.** Call Lab is `/portal/calls`,
Script Vault is `/portal/scripts`, Exchange is `/portal/shop`, Radio is
`/portal/music`. Quoter is not a route at all — it is an outbound link to a
third-party tool, outside the access model entirely. The full mapping is in
[CORE_PLATFORM_RECORD.md](../CORE_PLATFORM_RECORD.md) § 10a. Every sidebar
label resolves to a route in this repository; the naming just makes them look
divergent. That is a statement about names, not about deploy freshness — what
the worker is currently serving is DEPLOYMENT.md's question, and `main` can and
does run ahead of it.

**The surfaces are gated, but mostly unfilled.** The frame is real and enforces
access correctly. Business sources — CRM, carrier, dialer, financial — are not
connected. The presentation says so plainly in several places, and it should
keep saying so until it stops being true. A board that discovers overstatement
on its own stops believing the accurate parts too.
