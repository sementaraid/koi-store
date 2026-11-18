import { LayoutGrid } from "lucide-react"
import { cn } from "cn"

import { Label, RenderIf } from "@koi/ui"
import { CONTAINER } from "@/const/layout"
import { NativeSelect } from "@koi/ui/primitives/native-select"
import { Tabs, TabsList, TabsTrigger } from "@koi/ui/primitives/tabs"

export type FilterOption = {
  value: string
  label: string
}

export function Facet({
  id,
  label,
  value,
  onChange,
  options,
  className = "w-full sm:w-44",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  className?: string
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
        className={className}
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

export type FilterBarProps = {
  scope: string
  status: string
  tabs: FilterOption[]
  onStatusChange: (status: string) => void
  categoryLabel: string
  allCategoriesLabel: string
  categories: string[]
  category: string
  onCategoryChange: (category: string) => void
  sorts: FilterOption[]
  sort: string
  onSortChange: (sort: string) => void
}

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
            className="w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit"
          >
            {tabs.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
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
