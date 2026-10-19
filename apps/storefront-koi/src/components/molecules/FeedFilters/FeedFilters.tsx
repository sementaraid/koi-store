import { FilterBar, type FilterOption } from "@/components/cells/FilterBar/FilterBar"
import type { FiltersProps, GoodsFilter } from "@/types/product"

/** Props for {@link FeedFilters}: the feed's own vocabulary, on top of
    {@link FiltersProps}. */
export type FeedFiltersProps<F extends GoodsFilter<string>> =
  FiltersProps<F> & {
    /** What the band belongs to, as one word in `data-slot`: `"auction"`,
      `"catalog"`, `"market"`. Keeps the three bars distinguishable in the DOM. */
    scope: string
    /** The status tabs, in reading order, `"all"` first. */
    tabs: FilterOption[]
    /** Listing orders, as this feed words them. */
    sorts: FilterOption[]
    /** The category facet's heading: `"Varietas"` for koi, `"Kategori"` for goods. */
    categoryLabel: string
    /** The wording of that facet's empty option, e.g. `"Semua varietas"`. */
    allCategoriesLabel: string
  }

/**
 * A feed's control band, in that feed's own words.
 *
 * @remarks
 * The floor, the catalog and the shop each shipped a file that was this one with
 * three strings and two constant imports changed — the same four handlers, the
 * same three spreads, the same casts. One component, and what differed between
 * them becomes arguments at the call site.
 *
 * Presentation and intent only — it reports the whole next filter and holds no
 * state, so the caller decides whether that lands in a URL, a reducer, or
 * nowhere yet.
 *
 * @example
 * <FeedFilters
 *   scope="auction"
 *   filter={filter}
 *   categories={categories}
 *   onFilterChange={onFilterChange}
 *   tabs={DEFAULT_AUCTION_TABS}
 *   sorts={DEFAULT_AUCTION_SORTS}
 *   categoryLabel="Varietas"
 *   allCategoriesLabel="Semua varietas"
 * />
 */
export function FeedFilters<F extends GoodsFilter<string>>({
  filter,
  categories,
  onFilterChange,
  scope,
  tabs,
  sorts,
  categoryLabel,
  allCategoriesLabel,
}: FeedFiltersProps<F>) {
  return (
    <FilterBar
      scope={scope}
      status={filter.status}
      tabs={tabs}
      onStatusChange={(status) =>
        onFilterChange?.({ ...filter, status: status as F["status"] })
      }
      categoryLabel={categoryLabel}
      allCategoriesLabel={allCategoriesLabel}
      categories={categories}
      category={filter.category}
      onCategoryChange={(category) => onFilterChange?.({ ...filter, category })}
      sorts={sorts}
      sort={filter.sort}
      onSortChange={(sort) =>
        onFilterChange?.({ ...filter, sort: sort as F["sort"] })
      }
    />
  )
}
