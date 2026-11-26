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
  title?: string
  overlay?: ReactNode
  /* Board 03: the phone gallery runs full width and the desktop gallery stays
     in its column. "wide" also covers the 32 px gutter from `sm` up, so the
     product gallery stays flush to both edges on tablets (owner 2026-11-25). */
  bleed?: "phone" | "wide"
  /* Board 03/10: the lot gallery switches through its thumbnails and video
     tile, so the Foto/Video pills would be a second, redundant control. */
  hideTabs?: boolean
  className?: string
}

export function MediaStage({ items, title, overlay, bleed, hideTabs, className }: MediaStageProps) {
  const [index, setIndex] = useState(0)
  if (!items.length) return null

  const at = Math.min(index, items.length - 1)
  const kind = items[at].kind
  const kinds = MEDIA_TABS.filter((tab) =>
    items.some((item) => item.kind === tab.value)
  )

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2",
        bleed === "wide" ? "-mx-4 sm:-mx-8 lg:mx-0" : bleed && "-mx-4 lg:mx-0",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-3">
        <RenderIf when={!hideTabs && kinds.length > 1}>
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
      </div>

      <MediaGallery
        items={items}
        index={index}
        onSelect={setIndex}
        title={title}
        overlay={overlay}
        bleed={bleed}
      />
    </div>
  )
}
