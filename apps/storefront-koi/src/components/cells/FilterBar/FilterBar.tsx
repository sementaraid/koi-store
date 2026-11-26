import { cn } from "cn"

import { Label } from "@koi/ui"
import { SECTION_LABEL } from "@/const/layout"
import { NativeSelect } from "@koi/ui/primitives/native-select"
import { Tabs, TabsList, TabsTrigger } from "@koi/ui/primitives/tabs"

export type FilterOption = {
  value: string
  label: string
}

// One labelled filter field (design `.lbl` over `.sel`).
export function Facet({
  id,
  label,
  value,
  onChange,
  options,
  className = "w-full",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  className?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className={SECTION_LABEL}>
        {label}
      </Label>

      <NativeSelect
        id={id}
        variant="filled"
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
  className?: string
}

// The status tabs as the redesign's segmented control. They live in the feed
// hero, as on /lelang, not in a strip of their own. Sort and category live in
// the facet sidebar.
export function FilterBar({ scope, status, tabs, onStatusChange, className }: FilterBarProps) {
  return (
    <div data-slot={`${scope}-filters`} className={cn("min-w-0 max-sm:w-full", className)}>
      <Tabs value={status} onValueChange={onStatusChange}>
        {/* Explicit ids: the listing streams ahead of hydration, and React 19's
            `useId` replay can generate a different id on the client. `scope` is
            unique per feed ("catalog", "market"), so the two listings never
            share an id. */}
        <TabsList
          id={`${scope}-tabs-list`}
          variant="segment"
          className="max-w-full overflow-x-auto max-sm:min-h-0! max-sm:w-full max-sm:p-1!"
        >
          {tabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              id={`${scope}-tab-${value}`}
              value={value}
              className="max-sm:h-11! max-sm:min-h-0! max-sm:flex-1! max-sm:px-3! max-sm:text-[13px]!"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
