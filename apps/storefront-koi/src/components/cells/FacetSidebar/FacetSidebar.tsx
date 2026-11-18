import { SlidersHorizontal } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Facet } from "@/components/cells/FilterBar/FilterBar"
import { SECTION_LABEL } from "@/const/layout"
import type { AttributeFacet, AttributeSelection } from "@/types/product"

export type FacetSidebarProps = {
  attributes?: AttributeFacet[]
  selected?: AttributeSelection
  onAttributesChange?: (selected: AttributeSelection) => void
  className?: string
}

export function FacetSidebar({
  attributes = [],
  selected = {},
  onAttributesChange,
  className,
}: FacetSidebarProps) {
  if (!attributes.length) return null

  const narrowed = Object.keys(selected).length > 0

  return (
    <aside data-slot="facet-sidebar" className={cn("min-w-0", className)}>
      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn(SECTION_LABEL, "flex items-center gap-1.5")}>
            <SlidersHorizontal aria-hidden className="size-3.5" />
            Filter
          </h2>

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
