"use client"

import { useState } from "react"
import { Check, SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@koi/ui/primitives/sheet"
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

  const [sheetOpen, setSheetOpen] = useState(false)
  // Filters in force besides the sort: the badge on the phone's Filter button.
  const active = Object.keys(selected).length + (category ? 1 : 0)
  const categoryOptions = [
    { value: "", label: allCategoriesLabel },
    ...categories.map((c) => ({ value: c, label: c })),
  ]
  const clearAll = () => {
    if (category) onCategoryChange("")
    if (narrowed) onAttributesChange?.({})
  }

  // Both layouts are in the DOM (one hidden), so each copy gets its own ids.
  const sortField = (place: string) => (
    <Facet
      id={`${scope}-sort-${place}`}
      label="Urutkan"
      value={sort}
      onChange={onSortChange}
      options={sorts}
    />
  )

  const attributeFields = (place: string) =>
    attributes.map((facet) => (
    <Facet
      key={facet.handle}
      id={`facet-${facet.handle}-${place}`}
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
  ))

  return (
    <aside data-slot="facet-sidebar" className={cn("min-w-0", className)}>
      {/* Phone: the sort stays in view; every other filter moves into a
          bottom sheet so the results start above the fold. */}
      <div className="flex items-end gap-3 lg:hidden">
        <div className="min-w-0 flex-1">{sortField("phone")}</div>
        <Button
          type="button"
          variant="soft"
          onClick={() => setSheetOpen(true)}
          aria-label={active ? `Filter, ${active} aktif` : "Filter"}
          className="h-11 shrink-0 gap-2 rounded-field px-4 font-semibold"
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filter
          <RenderIf when={active > 0}>
            {() => (
              <span
                aria-hidden
                className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                {active}
              </span>
            )}
          </RenderIf>
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="gap-0">
            <SheetHeader className="border-b border-border pe-14">
              <SheetTitle className="text-base font-semibold">Filter</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4 py-4">
              <RenderIf when={categories.length > 0}>
                {() => (
                  <Facet
                    id={`${scope}-category-sheet`}
                    label={categoryLabel}
                    value={category}
                    onChange={onCategoryChange}
                    options={categoryOptions}
                  />
                )}
              </RenderIf>
              {attributeFields("sheet")}
            </div>
            <SheetFooter className="sticky bottom-0 flex-row border-t border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={clearAll}
                disabled={active === 0}
                className="flex-1"
              >
                Hapus filter
              </Button>
              <SheetClose render={<Button type="button" className="flex-1" />}>
                Tampilkan hasil
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: the board's sticky sidebar. */}
      <div className="hidden lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-6">
        {sortField("side")}

        <RenderIf when={categories.length ? categories : null}>
          {(list) => (
            // One choice from the list, so these are radios drawn as the
            // board's tick boxes.
            <fieldset className="flex flex-col gap-1">
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
          )}
        </RenderIf>

        {attributeFields("side")}

        <RenderIf when={narrowed}>
          {() => (
            <button
              type="button"
              onClick={() => onAttributesChange?.({})}
              className="self-start rounded-control text-sm font-semibold text-accent-ink underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Hapus filter
            </button>
          )}
        </RenderIf>
      </div>
    </aside>
  )
}
