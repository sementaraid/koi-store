---
name: render-check
description: Check in a real browser, with the playwright MCP, that a Koi Store page renders correctly - catches hydration errors, runtime errors such as "Cannot read properties of undefined", server 500s, Next's error and 404 pages, and "undefined" / "NaN" / "[object Object]" printed into the page. Use for every UI story before qa reports PASS, and by frontend before handing off a screen.
---

# Render check

A screenshot is not proof that a page works. In Next 15 dev (checked on 15.5.24
with React 19):

| Bug | HTTP | What the page looks like | Where it shows |
|---|---|---|---|
| Hydration mismatch | 200 | **Normal.** React re-renders on the client | page error in the console; dev overlay issue count 1, no dialog |
| Invalid HTML nesting (`<div>` in `<p>`) | 200 | Normal | console error "cannot be a descendant of" + hydration page error; issue count 2 |
| `undefined.x` in a component | 500 | "Application error: a client-/server-side exception" | page error; overlay dialog "Runtime TypeError"; dev server log `⨯` with source `file:line` |
| Error in a click or submit handler | 200 | **Normal** | page error; issue count goes up, no dialog |
| Missing value in JSX (`Rp {undefined}`) | 200 | "Rp " with nothing after it, or "undefined", "NaN", "[object Object]" | **only in the page text.** No error anywhere |
| Unknown route | 404 | "This page could not be found" (admin-koi) or "Halaman tidak ditemukan" (storefront) | page text |

So every check reads **four** sources: the HTTP status, the console, the dev
overlay, and the visible text. Missing one of them misses a class of bug.

## Setup

- Dev servers: storefront `http://localhost:3001`, admin `http://localhost:3002`,
  backend `http://localhost:9000`. The MCP is limited to these hosts.
- Is a server up? `curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://localhost:3001`
  (`000` = down). If it's down, report NOT VERIFIED and stop. Don't start or
  restart servers.
- The first visit to a route compiles it, which can take 10 s or more. That's
  normal.
- Logins: use the account the brief names. The table "Accounts and ports for
  browser checks" in `docs/process/flow.md` lists the standard ones (seeded
  customers, the approved farm `sakura.koi.farm@koi.dev`, the admin). If the
  seed data is missing, report NOT VERIFIED; don't run the seed yourself
  unless the brief says so. Never create users or change data to get in.

## Procedure (per route, and again after every action)

1. `browser_navigate` to the full URL. Note the HTTP status it reports.
2. `browser_evaluate` with the function below. It waits 2.5 s for hydration,
   then returns the overlay state and the text problems.
3. `browser_console_messages` with `level: "error"`. Page errors (uncaught
   exceptions, hydration failures) arrive here as `error` messages too.
4. `browser_snapshot` to check that the expected content is there: headings,
   the form fields the AC names, the row data. Take a `browser_take_screenshot`
   only as evidence for the report.
5. After each click, form fill or submit, repeat steps 2 and 3. Errors from
   handlers only show up then.
6. If anything failed with a 500 or a runtime error, get the source location
   from the dev server log:
   `docker compose logs --since 5m app 2>&1 | grep -A6 '⨯'`.
   The browser stack shows only bundled chunk names.

```js
async () => {
  await new Promise((r) => setTimeout(r, 2500));
  const root = document.querySelector('nextjs-portal')?.shadowRoot;
  const dialog = root?.querySelector('[data-nextjs-dialog]');
  const text = document.body.innerText;
  const bad = [
    [/\bundefined\b/, 'undefined'], [/\bNaN\b/, 'NaN'], [/\[object Object\]/, '[object Object]'],
    [/Invalid Date/, 'Invalid Date'], [/Rp\s*(\n|$)/, 'empty Rp amount']
  ].filter(([re]) => re.test(text)).map(([, label]) => label);
  const errorPage = [
    'Application error: a client-side exception', 'Application error: a server-side exception',
    'This page could not be found', 'Internal Server Error', 'Terjadi kesalahan', 'Halaman tidak ditemukan'
  ].filter((s) => text.includes(s));
  return {
    devOverlay: root ? 'present' : 'absent (not a dev server?)',
    issues: Number(root?.querySelector('[data-issues-count]')?.textContent ?? 0),
    errorDialog: dialog ? dialog.textContent.slice(0, 300) : null,
    errorPage,
    badText: bad,
    visibleText: text.slice(0, 200)
  };
}
```

## Verdict

A route **passes** only if all of these hold:
- HTTP status is 200, or the redirect the AC expects (for example, signed out →
  sign-in page)
- `issues` is 0 and `errorDialog` is null
- `errorPage` is empty, unless the AC is about that page
- `badText` is empty
- `browser_console_messages` at level `error` returns nothing
- the snapshot shows the content the AC describes

Anything else is a bug. Classify it in the report:
- **Hydration**: "Hydration failed", "didn't match the client", "cannot be a
  descendant of". Usually `Date.now()`, `new Date().toLocale…`, `Math.random()`,
  `typeof window` checks or locale formatting in render, or invalid nesting.
- **Runtime**: `TypeError` / `ReferenceError` / "is not a function" / "Cannot
  read properties of undefined". Include the `file:line` from the server log
  when there is one.
- **Server**: HTTP 500 or "server-side exception". Include the server log lines.
- **Missing data**: `badText` hits. Name the element and the value it should
  show.
- **Network**: a failed request in `browser_network_requests` (4xx/5xx) that
  the page doesn't handle with its error state.

Warnings (level `warning`) don't fail a route. List them under "Not blocking".

`devOverlay: absent` means you aren't on a dev server (or the page crashed
before Next loaded). The overlay checks then prove nothing: say so.

## Evidence in the report

Per route: URL, status, the evaluate result (trimmed), console errors
verbatim, and the screenshot path under `.playwright-mcp/`. For each bug: the
steps that trigger it, expected vs actual, and the source `file:line` if
known.
