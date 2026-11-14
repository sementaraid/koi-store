import { SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Facet } from "@/components/cells/FilterBar/FilterBar"
import { SECTION_LABEL } from "@/const/layout"
import type { AttributeFacet, AttributeSelection } from "@/types/product"

/** Props for {@link FacetSidebar}. */
export type FacetSidebarProps = {
  /** The catalog's filterable attributes, in its own order. Empty, the sidebar
      renders nothing at all — an aside of no controls is furniture. */
  attributes?: AttributeFacet[]
  /** Which attribute values are picked, by handle. */
  selected?: AttributeSelection
  /** Called with the whole next selection, so one changed facet does not make
      the caller reconstruct the others. */
  onAttributesChange?: (selected: AttributeSelection) => void
  className?: string
}

/**
 * The catalog's attribute facets, in a column beside the grid.
 *
 * @remarks
 * Separate from {@link FilterBar} because they are not the same kind of control.
 * The bar's three are the feed's own shape — a status, a category, an order —
 * and every feed has them. These are the catalog's *data*: eleven attributes
 * today, more whenever the shop defines one, each a select of every value the
 * attribute carries. Eleven of those in a horizontal band is a band that wraps
 * to four rows and pushes the first card below the fold.
 *
 * Each value is narrowed by the API, not by `filterGoods` — attribute values
 * never reach `SimpleProduct` — so a change here refetches rather than filtering
 * what is on screen. The options come from the attribute definitions, never
 * from the items present: a facet built off a narrowed page loses the option you
 * need to widen it again.
 *
 * ponytail: single select per attribute, no counts, no collapsing. Multi-select
 * is a shape change in `AttributeSelection` (string → string[]) and nothing
 * else; add it when a buyer asks for two bloodlines at once.
 */
export function FacetSidebar({
  attributes = [],
  selected = {},
  onAttributesChange,
  className,
}: FacetSidebarProps) {
  if (!attributes.length) return null

  const narrowed = Object.keys(selected).length > 0

  return (
    /* No width of its own: it is one track of the page's grid, and the caller
       owns the split. */
    <aside data-slot="facet-sidebar" className={cn("min-w-0", className)}>
      {/* Sticky past the header's height, so the facets stay reachable while
          the grid scrolls. Below `lg` the sidebar is a block above the grid and
          sticky would pin it over the cards. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
            <SlidersHorizontal aria-hidden className="size-3.5" />
            Filter
          </h2>

          {/* Only the attributes, not the band above: a visitor clearing this
              column did not ask to lose their sort. */}
          <RenderIf when={narrowed}>
            {() => (
              <Button
                variant="link"
                size="xs"
                className="px-0"
                onClick={() => onAttributesChange?.({})}
              >
                Hapus
              </Button>
            )}
          </RenderIf>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {attributes.map((facet) => (
            <Facet
              key={facet.handle}
              id={`facet-${facet.handle}`}
              label={facet.label}
              value={selected[facet.handle] ?? ""}
              onChange={(value) =>
                onAttributesChange?.(
                  /* Dropped rather than kept blank: an attribute that does not
                     narrow has no business in the URL or the query. */
                  value
                    ? { ...selected, [facet.handle]: value }
                    : Object.fromEntries(
                        Object.entries(selected).filter(
                          ([handle]) => handle !== facet.handle
                        )
                      )
                )
              }
              options={[
                { value: "", label: `Semua ${facet.label.toLowerCase()}` },
                ...facet.values.map((v) => ({ value: v, label: v })),
              ]}
              className="w-full"
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
