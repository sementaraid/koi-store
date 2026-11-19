# Task brief template

Copy this into the agent prompt for every `[backend]`, `[frontend]` and `[qa]`
task. A brief that fits this shape takes an agent ~45 minutes. A brief that
doesn't is two tasks.

Why: in the first ~14 agent-hours, ~30% went to rework caused by thin briefs —
a missing prerequisite route, a policy AC added after the code was built, and
types that never reached the Koi apps' `tsc`. Every section below exists because
that failure happened once.

## The brief

```
Story: US-xxx (tasks T-xxx.n)   Release: <slug>
Agent: <backend | frontend | qa>   Expected: <=45 min
Budget: 100 turns or 45 min; at the cap stop and report what is blocked.

## Acceptance criteria (quote verbatim from stories.md)
- ACn: …

## Decisions in force
D-xxx (one line each, why it constrains this task)

## Endpoint inventory  (frontend briefs: fill every row)
| Method | Path | Exists? | Shape / owner |
|---|---|---|---|
Rule: an "Exists? no" row becomes a backend task in the SAME story, ordered
first. Never let a frontend task discover a missing route at runtime.

## Start from
- file:line (the pattern to copy)
- file (the file to extend)

## Do not touch
- paths, workspaces, other stories' files

## Definition of done
- exact commands + expected output
- report: standard header + role section

## Open questions
(one numbered block, before starting — never mid-task)
```

## Cross-cutting checklist

Tick before handing off. These apply to every task, so they belong in the
brief, not in the agent's memory:
- [ ] PII: mask anyone else's NIK/bank/phone; self-view stays full (D-045);
      admins are not exempt (D-042)
- [ ] Every custom `/vendor/*` mutation starts with `validateSellerOpenStep`.
      One exception: the paid/shipped marks on a farmer's own sold lots check
      ownership and "not `terminated`" instead (D-054)
- [ ] Every error message a Koi app may show verbatim is Indonesian, written
      on the backend, rupiah `id-ID` (`Rp1.100.000`). `@mercurjs/client` keeps
      only `message` and `code`; never patch or wrap it to carry more (D-055).
      Apps still key on `code`/status, never on message text
- [ ] Money: whole-rupiah integers, `id-ID` formatting, never floats
- [ ] Ledgers append-only; balances are sums, never stored counters
- [ ] Every mutation is a workflow with compensation; routes stay thin
- [ ] New/changed route → `bun run codegen`
- [ ] A route file reading `req.seller_context` imports
      `…/types/seller-context` (otherwise the Koi apps' `tsc` fails)
- [ ] `bun run tsc` passes in **both** Koi apps when `packages/api/src` changed
- [ ] UI task: run the render check (`.claude/skills/render-check/SKILL.md`)
      with the `playwright` MCP on every changed route (or state plainly that
      it wasn't). It catches hydration and runtime errors a screenshot hides. Dev servers run on 3001 (storefront), 3002
      (admin) and 9000 (backend); the MCP container reaches them on
      `127.0.0.1`. Screenshots and page snapshots land in `.playwright-mcp/`
      (gitignored). Report the path; never `Read` the image back into context.
- [ ] Cheap by construction: one batched `docker compose exec … bash -lc '…'`
      for related reads, `Grep`/`Read` over `grep`/`sed`/`cat`, output capped,
      no polling loops, and the 100-turn / 45-minute budget stated in the brief.

## Dispatch rules

- One surface per run (form, list, edit). A brief expected to exceed 45 min is
  two briefs. State the budget in the brief: 100 turns or 45 minutes, then stop
  and report what is blocked.
- One Jest suite at a time in `packages/api`. Never dispatch QA while a backend
  agent is running its specs. QA runs one suite invocation covering all the
  story's specs, not one per AC.
- Backend changes that a frontend task consumes ship `codegen` output in the
  same run; the frontend brief pins the response shape.
- Commit when the product-owner accepts a story. Uncommitted trees make
  parallel work unsafe and lose a day's work to one bad edit.
- Start a fresh orchestrator session after each accepted story.
- Settle policy questions (masking, reveal, refunds, statuses) **before** the
  story that touches them is dispatched. A policy added later reopens an
  accepted AC.
