"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "cn"

import { RenderIf } from "@koi/ui"
import { Facet, type FilterOption } from "@/components/cells/FilterBar/FilterBar"
import { SECTION_LABEL } from "@/const/layout"
import type { AttributeFacet, AttributeSelection } from "@/types/product"

// The board lists "Semua varietas" plus four, then "Varietas lain".
const LISTED = 4

export type FacetSidebarProps = {
  scope: string
  sorts: FilterOption[]
  sort: string
  onSortChange: (sort: string) => void
  categoryLabel: string
  allCategoriesLabel: string
  categories: string[]
  category: string
  onCategoryChange: (category: string) => void
  attributes?: AttributeFacet[]
  selected?: AttributeSelection
  onAttributesChange?: (selected: AttributeSelection) => void
  className?: string
}

// Sort, category and attribute filters, laid out as the board's sidebar
// (design `aside`): label over a filled select, the category as a list.
export function FacetSidebar({
  scope,
  sorts,
  sort,
  onSortChange,
  categoryLabel,
  allCategoriesLabel,
  categories,
  category,
  onCategoryChange,
  attributes = [],
  selected = {},
  onAttributesChange,
  className,
}: FacetSidebarProps) {
  const narrowed = Object.keys(selected).length > 0
  const [open, setOpen] = useState(false)
  const listed = open ? categories : categories.slice(0, LISTED)
  // A chosen category past the cut stays visible, so the choice is never hidden.
  const shown = category && !listed.includes(category) ? [...listed, category] : listed

  return (
    <aside data-slot="facet-sidebar" className={cn("min-w-0", className)}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6">
        <Facet
          id={`${scope}-sort`}
          label="Urutkan"
          value={sort}
          onChange={onSortChange}
          options={sorts}
        />

        <RenderIf when={categories.length ? categories : null}>
          {(list) => (
            <>
              {/* A phone keeps the select so the list does not push the
                  results below the fold. */}
              <div className="lg:hidden">
                <Facet
                  id={`${scope}-category`}
                  label={categoryLabel}
                  value={category}
                  onChange={onCategoryChange}
                  options={[
                    { value: "", label: allCategoriesLabel },
                    ...list.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
              {/* One choice from the list, so these are radios drawn as the
                  board's tick boxes. */}
              <fieldset className="hidden flex-col gap-1 lg:flex">
                <legend className={cn(SECTION_LABEL, "mb-1")}>{categoryLabel}</legend>
                {[{ value: "", label: allCategoriesLabel }, ...shown.map((c) => ({ value: c, label: c }))].map(
                  (o) => (
                    <label
                      key={o.value || "all"}
                      className="group/opt flex cursor-pointer items-center gap-3 py-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`${scope}-category-list`}
                        value={o.value}
                        checked={category === o.value}
                        onChange={() => onCategoryChange(o.value)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className="flex size-4.5 shrink-0 items-center justify-center rounded-md border border-input group-has-checked/opt:border-primary group-has-checked/opt:bg-primary group-has-focus-visible/opt:ring-3 group-has-focus-visible/opt:ring-ring/50"
                      >
                        <Check className="size-3 text-primary-foreground opacity-0 group-has-checked/opt:opacity-100" />
                      </span>
                      {o.label}
                    </label>
                  )
                )}
                <RenderIf when={list.length > LISTED}>
                  {() => (
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpen((v) => !v)}
                      className="mt-1 self-start rounded-control text-sm font-semibold text-accent-ink underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {open ? `${categoryLabel} lebih sedikit` : `${categoryLabel} lain`}
                    </button>
                  )}
                </RenderIf>
              </fieldset>
            </>
          )}
        </RenderIf>

        {attributes.map((facet) => (
          <Facet
            key={facet.handle}
            id={`facet-${facet.handle}`}
            label={facet.label}
            value={selected[facet.handle] ?? ""}
            onChange={(value) =>
              onAttributesChange?.(
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
          />
        ))}

        <RenderIf when={narrowed}>
          {() => (
            <button
              type="button"
              onClick={() => onAttributesChange?.({})}
              className="col-span-2 justify-self-start rounded-control text-sm font-semibold text-accent-ink underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Hapus filter
            </button>
          )}
        </RenderIf>
      </div>
    </aside>
  )
}
