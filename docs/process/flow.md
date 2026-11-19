# Delivery flow

How one story goes from `todo` to committed, and how to hand each step to an
agent. Every brief follows [`task-brief.md`](task-brief.md). Agents copy patterns
from the `koi-delivery` skill.

## The cycle

| # | Who | Starts when | Max time | Output |
|---|---|---|---|---|
| 0 | Owner or orchestrator | Previous story accepted | 1 min | Commit |
| 1 | product-owner | Story picked | 10 min | Briefs, endpoint inventory; missing routes become backend tasks |
| 2 | backend | Briefs ready | 45 min per task | Code, spec, `codegen`, API contract |
| 3 | frontend | Backend contract delivered | 45 min per screen | Screen, `check`, render check |
| 4 | qa | No `packages/api` agent running | 30 min | PASS/FAIL per AC, render check per route |
| 5 | backend or frontend | qa FAIL | 2 rounds max, then report to owner | Fix |
| 6 | product-owner | qa PASS | 10 min | `done`, tasks ticked |
| 7 | Owner or orchestrator | Accepted | 1 min | Commit |

Every step is budgeted at 100 turns or 45 minutes. An agent that hits the cap
stops and reports what is blocked; the task is split, not extended. Keep
commits small and immediate (step 0 and 7) so a long approval wait never parks
the whole cycle.

## Parallel rules

- One backend agent at a time in `packages/api`. A second needs
  `isolation: "worktree"`.
- One frontend agent per app: storefront-koi and admin-koi can run side by side.
- Start product-owner (step 1) and the qa re-check of the previous story in
  parallel with backend/frontend work. Idle orchestration is the biggest cost.
- **Start a fresh session when a story is accepted.** A session that spans
  stories re-sends every earlier turn on every call; context above ~200k tokens
  roughly doubles per-turn latency.
- qa starts only when no other Jest run is active (`EADDRINUSE 127.0.0.1:5432`).
- Step 3 never starts before step 2 has delivered its API contract, unless every
  route in the frontend brief's endpoint inventory already exists.
- Policy questions (masking, refunds, statuses) are answered before step 1. A
  policy added later reopens accepted criteria.

## Shortcut

Tell the orchestrator **"run US-xxx"**. It runs steps 1 to 7 and stops only on a
second qa FAIL or a question only the owner can answer.

## Prompt templates

Replace `<…>`. Keep every section; an empty section is a gap in the brief.

### Step 1: product-owner writes the briefs

```
Use docs/process/task-brief.md.
Story: US-xxx   Release: <slug>
1. Readiness: confirm no open question blocks it and every policy it touches is decided.
2. Write one brief per task (T-xxx.n). In each frontend brief's endpoint inventory,
   list every route the screen reads. A route that doesn't exist becomes a backend
   task in this story, ordered first.
3. Each brief must fit ≤45 min. Split any bigger one.
Write the briefs under the US-xxx section in stories.md. Docs only, no commit.
Report: the briefs, plus any new task or question.
```

### Step 2: backend

```
Use the koi-delivery skill and docs/process/task-brief.md.
Story: US-xxx (T-xxx.n)   Release: <slug>   Agent: backend   Expected: ≤45 min
Budget: 100 turns or 45 min; at the cap stop and report what is blocked.
ACs: <quoted verbatim>
Decisions: <D-xxx, one line each>
Build: <route / workflow / job, in one paragraph>
Start from: <file:line to copy>, <file to extend>
Do not touch: apps/, <other stories' files>
Done when:
  bun x tsc --noEmit -p .                          → clean
  bun run codegen                                  → if routes changed
  bun run test:integration:http -- <spec>          → pass (run alone)
  bun run tsc in apps/storefront-koi and apps/admin-koi → clean
Report: standard header + API contract (method, path, body, response, errors). Don't commit.
```

### Step 3: frontend

```
Use the koi-delivery skill and docs/process/task-brief.md.
Story: US-xxx (T-xxx.n)   Release: <slug>   Agent: frontend   Expected: ≤45 min
Budget: 100 turns or 45 min; at the cap stop and report what is blocked.
ACs: <quoted verbatim>
Endpoint inventory:
  | Method | Path | Exists? | Shape |
Build: <one screen>
Start from: <component/data file to copy>
Do not touch: packages/api, <the other app>, <other screens>
Done when:
  cd apps/<app> && bun run check                   → pass
  render check (render-check skill) on <route> as <account>, incl. one form submit → clean
Report: standard header + render check result + screenshot path. Don't commit.
```

### Step 4: qa

```
Use the koi-delivery skill.
Story: US-xxx   Release: <slug>   Agent: qa   Expected: ≤30 min
Budget: 100 turns or 45 min; at the cap stop and report what is blocked.
Verify every AC in stories.md. Decisions: <D-xxx>.
Code under test: <paths>
Commands (alone, nothing else on Jest): <spec list, one invocation>; bun run check in each touched app.
Browser: render check (render-check skill) on <routes> as <accounts>, walking each AC's flow.
Watch for: <recurring risk for this story>.
Don't change app code. Report PASS/FAIL per AC with file:line and command output;
bugs with repro and expected/actual.
```

### Step 5: fix round (only after FAIL)

```
Bug from qa on US-xxx: <bug, repro, expected/actual>.
Fix only this. Same done-when checks as the original task. Max 45 min. Don't commit.
```

### Step 6: product-owner accepts

```
Story: US-xxx. qa reports PASS: <evidence block>.
Spot-check each file:line. Accept or reject per docs/README.md. If accepted, tick the
tasks, set `done (evidence: …; qa PASS)`, and edit only the US-xxx section. No commit.
```

### Step 7: commit

```
git add <the story's files> && git commit -m "feat(US-xxx): <what it does>"
```

## Accounts and ports for browser checks

| App | URL | Sign in |
|---|---|---|
| Storefront + Farmer area | `http://127.0.0.1:3001` | Seeded customers `*@koi.dev` / `supersecret`; approved farm `sakura.koi.farm@koi.dev` / `supersecret` (customer with a Rp500.000 wallet plus member and `open` seller, so it opens the Farmer area) |
| Admin | `http://127.0.0.1:3002/masuk` | Seeded admin `admin@koi.dev` / `supersecret` (env `ADMIN_EMAIL` / `ADMIN_PASSWORD` override these defaults; `seed-koi.ts` creates it when missing) |
| Backend | `http://127.0.0.1:9000` | — |

Screenshots and page snapshots land in `.playwright-mcp/` (gitignored).
