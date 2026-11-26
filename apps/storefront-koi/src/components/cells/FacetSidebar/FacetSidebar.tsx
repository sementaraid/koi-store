"use client"

import { useRef, useState } from "react"
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
import { facetLabel, facetValueLabel } from "@/lib/helpers/attribute-facets"
import type { AttributeFacet, AttributeSelection } from "@/types/product"

// The board lists "Semua varietas" plus four, then "Varietas lain".
const LISTED = 4

// The phone toolbar chip, at the 44 px touch target and the /lelang shape.
const CHIP =
  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

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
  // Resets the whole feed (status too), as `Hapus filter` does on /lelang.
  onReset?: () => void
  hasFilters?: boolean
  className?: string
}

// Sort, category and attribute filters, laid out as the board's sidebar
// (design `aside`): label over a filled select, the category as a list. On a
// phone the same fields live in one bottom sheet behind a chip row.
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
  onReset,
  hasFilters,
  className,
}: FacetSidebarProps) {
  const narrowed = Object.keys(selected).length > 0
  const [open, setOpen] = useState(false)
  const listed = open ? categories : categories.slice(0, LISTED)
  // A chosen category past the cut stays visible, so the choice is never hidden.
  const shown = category && !listed.includes(category) ? [...listed, category] : listed

  const [sheetOpen, setSheetOpen] = useState(false)
  // The chip that opened the sheet gets focus back when it closes.
  const opener = useRef<HTMLButtonElement | null>(null)

  // Filters in force besides the sort: the badge on the phone's Filter button.
  const active = Object.keys(selected).length + (category ? 1 : 0)
  const dirty = hasFilters ?? active > 0
  const categoryOptions = [
    { value: "", label: allCategoriesLabel },
    ...categories.map((c) => ({ value: c, label: c })),
  ]
  const currentSort = sorts.find((option) => option.value === sort)?.label ?? "Urutkan"
  const clearAll = () => {
    if (category) onCategoryChange("")
    if (narrowed) onAttributesChange?.({})
  }
  const reset = onReset ?? clearAll

  const openSheet = (element: HTMLButtonElement) => {
    opener.current = element
    setSheetOpen(true)
  }

  const changeSheet = (next: boolean) => {
    setSheetOpen(next)
    // Base UI returns focus to the last focused element; make it explicit so
    // the chip that opened the sheet is always the one focused on close.
    if (!next) requestAnimationFrame(() => opener.current?.focus())
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

  const categoryField = (place: string) => (
    <RenderIf when={categories.length > 0}>
      {() => (
        <Facet
          id={`${scope}-category-${place}`}
          label={categoryLabel}
          value={category}
          onChange={onCategoryChange}
          options={categoryOptions}
        />
      )}
    </RenderIf>
  )

  const attributeFields = (place: string) =>
    attributes.map((facet) => {
      const label = facetLabel(facet.handle, facet.label)
      return (
        <Facet
          key={facet.handle}
          id={`facet-${facet.handle}-${place}`}
          label={label}
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
            { value: "", label: `Semua ${label.toLowerCase()}` },
            ...facet.values.map((v) => ({
              value: v,
              label: facetValueLabel(facet.handle, v),
            })),
          ]}
        />
      )
    })

  return (
    <aside data-slot="facet-sidebar" className={cn("min-w-0", className)}>
      {/* Phone: one chip row, all of it opening the same sheet, as on /lelang.
          The chip row stays above the results so nothing pushes them down. */}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <button
          type="button"
          onClick={(event) => openSheet(event.currentTarget)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={active ? `Filter, ${active} aktif` : "Filter"}
          className={CHIP}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          Filter
          <RenderIf when={active > 0}>
            {() => (
              <span
                aria-hidden
                className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums"
              >
                {active}
              </span>
            )}
          </RenderIf>
        </button>

        <RenderIf when={categories.length > 0}>
          {() => (
            <button
              type="button"
              onClick={(event) => openSheet(event.currentTarget)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              aria-label={`${categoryLabel}: ${category || allCategoriesLabel}`}
              className={CHIP}
            >
              {category || categoryLabel}
            </button>
          )}
        </RenderIf>

        <button
          type="button"
          onClick={(event) => openSheet(event.currentTarget)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={`Urutkan: ${currentSort}`}
          className={CHIP}
        >
          {currentSort}
        </button>

        <Sheet open={sheetOpen} onOpenChange={changeSheet}>
          <SheetContent side="bottom" className="gap-0">
            <SheetHeader className="border-b border-border pe-14">
              <SheetTitle className="text-base font-semibold">Filter</SheetTitle>
            </SheetHeader>
            <div className="flex max-h-[65svh] flex-col gap-4 overflow-y-auto px-4 py-4">
              {sortField("sheet")}
              {categoryField("sheet")}
              {attributeFields("sheet")}
            </div>
            <SheetFooter className="sticky bottom-0 flex-row border-t border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={!dirty}
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

        <RenderIf when={dirty}>
          {() => (
            <button
              type="button"
              onClick={reset}
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
