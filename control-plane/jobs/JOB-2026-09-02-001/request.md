# Request

## Owner intent

Integrate official Computer Use as the courier and visual-QA layer between
Vera, Worker A / Dispatch, and Chrome Worker B. Use a shared job record so the
owner does not manually copy work orders or results. Do not make Computer Use
the source of truth.

## Normalized objective

Create the Phase 1 repository-backed control-plane contract and prepare it for
Dispatch review, without modifying existing application code or production.

## Source-of-truth inputs

- IMO Operating Portal Master Instruction File, including the automation
  blueprint.
- IMO Operating Portal Design Spec Sheet.
- `AGENTS.md`, `CLAUDE.md`, and `CORE_PLATFORM_RECORD.md` in this repository.

## Decisions required

The harmless round-trip message still requires action-time confirmation before
Computer Use sends it. All consequential actions remain separately owner-gated.
