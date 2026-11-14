# UI Kit Guide (`@koi/ui`)

This guide covers work in `packages/ui`, the shared design system used by
`apps/storefront-koi` and `apps/admin-koi`. One kit keeps both apps looking the
same.

## How it is shipped

- The package is **exported as source**, with no build step and no `dist`. Each
  app compiles it through `transpilePackages: ['@koi/ui']` in `next.config.ts`.
- Entry points (from `package.json` `exports`):
  - `@koi/ui`: the primitives listed in `src/index.ts`
  - `@koi/ui/surface`: shared surface and shadow tokens
  - `@koi/ui/primitives/*`: lower-level Base UI wrappers (sheet, tabs, dropdown, ...)
  - `@koi/ui/styles.css`: the `@source` hint for Tailwind
- Each app's `globals.css` must import `@koi/ui/styles.css`. Without it, Tailwind
  won't generate classes that only kit components use.

## What belongs here

- Belongs here: generic primitives both apps can use, such as buttons, inputs,
  form fields, cards, badges, tables, dialogs and sheets.
- Doesn't belong here: anything that knows about koi, auctions, products or the
  API. Domain components (`LotLayout`, `BidTerminal`, `ProductCard`) stay in their
  app.
- No data fetching, no `@mercurjs/client`, no `next/*` imports. The kit must work
  in any React 19 app.

## Rules

- When you add or rename an export, update `src/index.ts` and check that both apps
  still type-check, because both import from here.
- Variants use `cva`. Merge classes with `cn`. Build on `@base-ui/react`
  primitives.
- Use theme tokens (`accent-ink`, `destructive-ink`, ...) and `surface.ts`. No raw
  hex colours. Each app defines the token values in its own `globals.css`.
- Keep components accessible: focus rings, labels, keyboard support and correct
  roles.
- React is a peer dependency (`>=19`). Don't add React to `dependencies`.

## Verification

After you change the kit, run all three:
1. `cd packages/ui && bun run tsc`
2. `cd apps/storefront-koi && bun run tsc`
3. `cd apps/admin-koi && bun run tsc`
