import { FilterBar, type FilterOption } from "@/components/cells/FilterBar/FilterBar"
import type { GoodsFilter } from "@/types/product"

export type FeedFiltersProps<F extends GoodsFilter<string>> = {
  filter: F
  onFilterChange?: (filter: F) => void
  scope: string
  tabs: FilterOption[]
}

export function FeedFilters<F extends GoodsFilter<string>>({
  filter,
  onFilterChange,
  scope,
  tabs,
}: FeedFiltersProps<F>) {
  return (
    <FilterBar
      scope={scope}
      status={filter.status}
      tabs={tabs}
      onStatusChange={(status) =>
        onFilterChange?.({ ...filter, status: status as F["status"] })
      }
    />
  )
}
