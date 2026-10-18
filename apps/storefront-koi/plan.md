# Convert remaining raw conditionals to RenderIf (storefront-koi)

## Context
`RenderIf` already exists at `src/components/atoms/RenderIf/RenderIf.tsx` (ported from the koi project already, byte-identical) and is used in 44 files. The user wants every leftover raw render-gate (`? x : null`, `{x && <jsx/>}`, `x ? <A/> : null`, and — per their answer — two-branch ternaries `x ? <A/> : <B/>`) converted to `RenderIf`, so the whole codebase states "may render nothing" the same way. `src/components/ui/*` (vendored shadcn/Base-UI primitives) is out of scope, to keep future regeneration a clean diff.

No new file needed — `RenderIf` is already wired into `src/components/atoms/index.ts`.

## Pattern
For a single-branch gate:
```tsx
{x ? <A/> : null}        ->  <RenderIf when={x}>{() => <A/>}</RenderIf>
{x && <A/>}               ->  <RenderIf when={x}>{() => <A/>}</RenderIf>
{x === undefined ? null : <A/>}  ->  <RenderIf when={x !== undefined}>{() => <A/>}</RenderIf>
```
When the JSX actually uses the narrowed value, pass it through instead of ignoring the arg (e.g. `<RenderIf when={image}>{(src) => <img src={src} .../>}</RenderIf>`).

For a two-branch ternary (`x ? <A/> : <B/>`), split into two gates on the condition and its negation:
```tsx
<RenderIf when={x}>{() => <A/>}</RenderIf>
<RenderIf when={!x}>{() => <B/>}</RenderIf>
```
Skip this split for cases that are text/value selection rather than element-vs-null (e.g. `remaining > 0 ? "Ditutup dalam" : "Lelang"`, `kindLabel` strings, `lot ? "attention" : "neutral"` variant props) — `RenderIf` is for render gates, not for picking between two strings or prop values. Leave `cn(x && "class")` className concatenation alone too — same reasoning.

## Files to touch (representative, not exhaustive — same pattern repeats)
- `src/components/cells/AccountMenu/AccountMenu.tsx` — `index > 0 && <Separator/>`, `groups.length > 0 && <Separator/>`
- `src/components/cells/BroadcastBar/BroadcastBar.tsx` — `liveCount === undefined ? null : (...)`, `stats.length ? (...) : null`, `Icon ? (...) : null`
- `src/components/cells/CartDeadline/CartDeadline.tsx` — `remaining !== null ? (...) : null`
- `src/components/cells/CartSteps/CartSteps.tsx` — `i > 0 ? (...) : null`
- `src/components/cells/FeedSummary/FeedSummary.tsx` — `pageCount > 1 ? (...) : null`
- `src/components/cells/FilterBar/FilterBar.tsx` — `value === "all" ? (...) : null`
- `src/components/cells/LiveBand/LiveBand.tsx` — `clock === undefined ? null : (...)`
- `src/components/cells/MediaGallery/MediaGallery.tsx` — `active.kind === "video" ? <video/> : <img/>` (two-branch), `overlay ? (...) : null`, `items.length > 1 ? (...) : null`, thumbnail `item.kind === "video" ? (...) : null`
- `src/components/cells/PageBreadcrumb/PageBreadcrumb.tsx` — `i > 0 ? <Separator/> : null`, the three-way `last ? ... : crumb.href ? ... : ...` (two of its three branches are real alternatives — leave this one as a plain ternary chain; not a clean render-gate)
- `src/components/molecules/CartLine/CartLine.tsx` — `per ? (...) : null`, `lot ? (...) : (...)` (two-branch)
- `src/components/organisms/BidTerminal/BidTerminal.tsx` — inner `remaining !== null ? (...) : null` (currently inside a `RenderIf when={!broadcast}` closure — convert the inner ternary too)
- `src/components/organisms/CartSummary/CartSummary.tsx` — `deferred ? (...) : (...)` (two-branch)
- `src/components/organisms/Footer/Footer.tsx` — `index > 0 && (...)`
- `src/components/organisms/ProductCard/ProductFrame.tsx` — `image ? <img/> : <div/>` (two-branch), `href ? <a/> : title` (two-branch, second arm is plain text not an element — keep as ternary, not a render gate), `Icon ? <Icon/> : null`, `price !== undefined ? (...) : null`, `trailing ? (...) : null`
- `src/components/sections/Shipping/components/ShippingPage.tsx` — the three-way `quantity && isCounted(...) ? (...) : product.listing?.ref ? (...) : null` (two real alternatives + null fallback — convert outer `: null` edge, keep the branch choice as ternary since both arms are real)

## Judgment calls
- Three-way ternaries where every arm is a distinct real alternative (not element-vs-null) stay ternaries; only the "render something vs. render nothing" half of any expression gets converted.
- `src/components/ui/*` left untouched per user's answer.
- `src/lib`, `src/app`, `src/hooks` — scanned, no raw render-gate conditionals found outside `src/components`.

## Verification
- `bun run lint` (or `npx tsc --noEmit` if lint unavailable) in `apps/storefront-koi` — confirms no type errors from the refactor (RenderIf's generic typing must still narrow correctly).
- Manual grep after: `grep -rn "? (\|&& <\|: null" src/components --include="*.tsx" | grep -v src/components/ui` should only show the deliberately-skipped cases listed above.
