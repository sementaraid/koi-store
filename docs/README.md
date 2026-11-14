# Koi Store docs

This is the map of the project's documentation and the process the team follows
from an idea to shipped code. Every agent and every person follows the same
process. The root `CLAUDE.md` defines the engineering rules. This folder defines
**what** to build.

## Where things are

| Path | What it holds | Who maintains it |
|---|---|---|
| `docs/product/overview.md` | What Koi Store is, roles, glossary. True across releases | product-owner (owner approves) |
| `docs/product/decisions.md` | Every owner decision that is in force, with ID, date and reason | product-owner (owner approves) |
| `docs/releases/README.md` | Index of releases and their status | product-owner |
| `docs/releases/<release>/plan.md` | The spec for one release: goals, rules, scope, milestones | owner (product-owner drafts) |
| `docs/releases/<release>/stories.md` | That release's user stories, acceptance criteria, tasks, coverage, open questions | product-owner |
| `docs/releases/_template/` | Starting files for a new release | product-owner |

**Which spec applies?** The plan of the release you're working in. If a later
release changes a rule from an earlier one, its plan must say so explicitly, and
the change is recorded in `decisions.md`. When two documents disagree, the newest
decision in `decisions.md` wins. Report the conflict; don't pick silently.

## How a feature ships

| Step | Who | Output | Gate to the next step |
|---|---|---|---|
| 1. Idea | Owner | A description of the feature | — |
| 2. Plan | product-owner drafts, owner approves | `docs/releases/<release>/plan.md` from the template | Owner approves the plan |
| 3. Stories | product-owner | `stories.md` with stories, ACs, tasks, coverage matrix, open questions | Every plan section is covered, and open questions are answered for the stories picked next |
| 4. Build | backend → codegen → frontend | Code and tests for one story at a time | Builder's checks pass, with output in the report |
| 5. Verify | qa | Report: each AC as PASS, FAIL or NOT VERIFIED, with evidence | qa PASS (at most 2 fix rounds after a FAIL) |
| 6. Accept | product-owner | Story set to `done`, evidence linked | Every AC is proven |
| 7. Ship | Owner | Release status set to `shipped` in `releases/README.md` | All stories in the release are `done` |

Small changes that don't need a release (a bug fix, a copy change) skip steps
2–3. They still go through steps 4–6, against a story added to the active
release's `stories.md` under **Unplanned**.

## Conventions

**IDs.** All IDs are global and never reused. The next ID is one higher than
the highest that already exists, in any release.

| Prefix | Meaning | Example |
|---|---|---|
| `US-` | User story | `US-042` |
| `T-` | Task: story number plus a sequence | `T-042.3` |
| `D-` | Owner decision | `D-003` |
| `<release>-Q` | Open question within a release | `mvp-Q6` |

**Story format.** *As a … I want … so that …* · acceptance criteria (`AC1`,
`AC2`, … each testable) · tasks · plan reference · status.

**Story status.** `todo` · `in progress` · `blocked (<question id>)` ·
`done (evidence: <link or command output>)`

**Task tags.** Each tag says which agent owns the task:

| Tag | Owner | Where |
|---|---|---|
| `[backend]` | backend | `packages/api` |
| `[storefront]` | frontend | `apps/storefront-koi` |
| `[admin]` | frontend | `apps/admin-koi` |
| `[ui]` | frontend | `packages/ui` |
| `[qa]` | qa | Tests and verification |
| `[ops]` | Owner | Servers, providers, accounts |

Tick a task `[x]` only when its check has run and passed.

**Release status.** `planning` · `in progress` · `shipped`
