import { useState, type ReactNode } from "react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import {
  MediaGallery,
  type MediaItem,
} from "@/components/cells/MediaGallery/MediaGallery"

export type { MediaItem }

const MEDIA_TABS = [
  { value: "image", label: "Foto" },
  { value: "video", label: "Video" },
] as const

export type MediaStageProps = {
  items: MediaItem[]
  overlay?: ReactNode
  className?: string
}

export function MediaStage({ items, overlay, className }: MediaStageProps) {
  const [index, setIndex] = useState(0)
  if (!items.length) return null

  const at = Math.min(index, items.length - 1)
  const kind = items[at].kind
  const kinds = MEDIA_TABS.filter((tab) =>
    items.some((item) => item.kind === tab.value)
  )

  return (
    <div className={cn("relative flex flex-col gap-2.5", className)}>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3">
        <RenderIf when={kinds.length > 1}>
          {() => (
            <div className="pointer-events-auto flex gap-1.5">
              {kinds.map((tab) => (
                <Button
                  key={tab.value}
                  type="button"
                  variant="ghost"
                  aria-pressed={kind === tab.value}
                  onClick={() =>
                    setIndex(items.findIndex((i) => i.kind === tab.value))
                  }
                  className={cn(
                    "h-auto rounded-full px-3.5 py-2 text-2xs font-bold text-white backdrop-blur-sm",
                    kind === tab.value
                      ? "bg-white/95 text-foreground hover:bg-white/95"
                      : "bg-white/15 hover:bg-white/25"
                  )}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          )}
        </RenderIf>

        <span className="pointer-events-none ms-auto rounded-full bg-white/15 px-2.5 py-1 font-mono text-2xs text-white tabular-nums backdrop-blur-sm">
          {at + 1} / {items.length}
        </span>
      </div>

      <MediaGallery
        items={items}
        index={index}
        onSelect={setIndex}
        overlay={overlay}
      />
    </div>
  )
}
