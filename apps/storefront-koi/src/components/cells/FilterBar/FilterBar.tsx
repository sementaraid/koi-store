import { LayoutGrid } from "lucide-react"
import { cn } from "cn"

import { Label } from "@/components/ui/label"
import { CONTAINER } from "@/const/layout"
import { NativeSelect } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"

/** One selectable option: the value the API will take, and its wording. */
export type FilterOption = {
  value: string
  label: string
}

/** One labelled native select. Native rather than the kit's popup select: this
    is a form bar, a form works without JavaScript, and this is the cheaper
    thing to build. */
function Facet({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>

      <NativeSelect
        id={id}
        size="sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full sm:w-44"
      >
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

/** Props for {@link FilterBar}. */
export type FilterBarProps = {
  /** What the band belongs to, as one word in `data-slot`: `auction`, `catalog`,
      `market`. Keeps the three bars distinguishable in the DOM. */
  scope: string
  /** The live status facet — the value the page tabs over. */
  status: string
  /** The status tabs, in reading order, `"all"` first. */
  tabs: FilterOption[]
  /** Called with the status the visitor picked. */
  onStatusChange: (status: string) => void
  /** The category facet's heading: `"Varietas"` for koi, `"Kategori"` for goods. */
  categoryLabel: string
  /** The wording of the category facet's empty option, e.g. `"Semua varietas"`. */
  allCategoriesLabel: string
  /** Categories present in the feed, already deduped and sorted. */
  categories: string[]
  /** The selected category, or `""` for all of them. */
  category: string
  onCategoryChange: (category: string) => void
  /** Listing orders, as the feed words them. */
  sorts: FilterOption[]
  /** The selected order. */
  sort: string
  onSortChange: (sort: string) => void
}

/**
 * The band of controls under a feed's heading: status tabs, a category facet and
 * the listing order.
 *
 * @remarks
 * One bar for the floor, the catalog and the shop. The three are the same form
 * in different vocabularies — lifecycle, availability, stock — so what a page
 * supplies is its tabs, its sort options and the two words its category facet
 * uses, not a fourth copy of this markup.
 *
 * Presentation and intent only: it reports each change and holds no state, so
 * the caller decides whether that lands in a URL, a reducer, or nowhere yet.
 */
export function FilterBar({
  scope,
  status,
  tabs,
  onStatusChange,
  categoryLabel,
  allCategoriesLabel,
  categories,
  category,
  onCategoryChange,
  sorts,
  sort,
  onSortChange,
}: FilterBarProps) {
  return (
    /* Full-bleed primary tint, inner column on the page container — the same
       column the grid sits on, so the tabs and facets line up with the cards.
       No edge: the band is separated by tone, not a rule. */
    <div data-slot={`${scope}-filters`} className="bg-primary/5">
      <div
        className={cn(
          CONTAINER,
          "flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between"
        )}
      >
        <Tabs value={status} onValueChange={onStatusChange} className="gap-2">
          <TabsList
            variant="line"
            /* Both axes are named. `overflow-x-auto` on its own silently makes
               the other axis `auto` too, and the line variant's underline sits
               below the trigger — past the list's own padding — which leaves a
               1px scrollable overflow and a bar you can drag the tabs up on.
               Nothing is clipped: the underline is inside the padding box. */
            className="w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit"
          >
            {tabs.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                /* The line variant's indicator and current label are `foreground`
                   by default; on a brand-tinted band the brand tone is the one
                   that reads as "you are here". The `dark:` pair is repeated
                   because the trigger's own dark rules outrank a plain override. */
                className="flex-none px-3 text-accent-ink/70 after:bg-primary hover:text-accent-ink dark:hover:text-accent-ink data-active:text-accent-ink dark:data-active:text-accent-ink"
              >
                <RenderIf when={value === "all"}>
                  {() => <LayoutGrid aria-hidden data-icon="inline-start" />}
                </RenderIf>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-end gap-3">
          <Facet
            id="facet-category"
            label={categoryLabel}
            value={category}
            onChange={onCategoryChange}
            options={[
              { value: "", label: allCategoriesLabel },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Facet
            id="facet-sort"
            label="Urutkan"
            value={sort}
            onChange={onSortChange}
            options={sorts}
          />
        </div>
      </div>
    </div>
  )
}
