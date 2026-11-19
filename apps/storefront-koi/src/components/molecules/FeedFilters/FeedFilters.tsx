import { FilterBar, type FilterOption } from "@/components/cells/FilterBar/FilterBar"
import type { FiltersProps, GoodsFilter } from "@/types/product"

export type FeedFiltersProps<F extends GoodsFilter<string>> =
  FiltersProps<F> & {
    scope: string
    tabs: FilterOption[]
    sorts: FilterOption[]
    categoryLabel: string
    allCategoriesLabel: string
  }

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
