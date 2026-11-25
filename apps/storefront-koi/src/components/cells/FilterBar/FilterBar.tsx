import { cn } from "cn"

import { Label } from "@koi/ui"
import { CONTAINER, SECTION_LABEL } from "@/const/layout"
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
}

// The status tabs as the redesign's segmented control. Sort and category live
// in the facet sidebar, as on the board.
export function FilterBar({ scope, status, tabs, onStatusChange }: FilterBarProps) {
  return (
    <div data-slot={`${scope}-filters`} className={cn(CONTAINER, "pt-6")}>
      <Tabs value={status} onValueChange={onStatusChange}>
        <TabsList variant="segment" className="max-w-full overflow-x-auto">
          {tabs.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
