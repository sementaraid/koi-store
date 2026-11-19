import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { Play } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
export type MediaItem = {
  src: string
  kind: "image" | "video"
  poster?: string
}

export type MediaGalleryProps = {
  items: MediaItem[]
  index?: number
  onSelect?: (index: number) => void
  overlay?: ReactNode
  className?: string
}

export function MediaGallery({
  items = [],
  index,
  onSelect,
  overlay,
  className,
}: MediaGalleryProps) {
  const controlled = index !== undefined
  const [picked, setPicked] = useState(0)

  if (!items.length) return null

  const current = Math.min(
    Math.max(0, controlled ? index : picked),
    items.length - 1
  )
  const active = items[current]

  const select = (at: number) => {
    if (!controlled) setPicked(at)
    onSelect?.(at)
  }

  return (
    <div
      data-slot="media-gallery"
      className={cn("flex w-full flex-col gap-2.5", className)}
    >
      <div className="relative flex aspect-16/10 w-full items-center justify-center overflow-hidden rounded-lg bg-foreground/90">
        <RenderIf when={active.kind === "video"}>
          {() => (
            <video
              key={active.src}
              src={active.src}
              poster={active.poster}
              aria-label="Rekaman koi dari breeder"
              controls
              playsInline
              preload="metadata"
              className="size-full object-contain"
            />
          )}
        </RenderIf>
        <RenderIf when={active.kind !== "video"}>
          {() => (
            <img
              key={active.src}
              src={active.src}
              alt="Foto koi dari breeder"
              className="size-full object-contain"
            />
          )}
        </RenderIf>

        <RenderIf when={overlay}>
          {(node) => (
            <div className="pointer-events-none absolute bottom-3 start-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-end gap-3">
              {node}
            </div>
          )}
        </RenderIf>
      </div>

      <RenderIf when={items.length > 1}>
        {() => (
          <ul
            aria-label="Media lot"
            className="flex snap-x gap-2 overflow-x-auto pb-1"
          >
            {items.map((item, at) => (
              <li key={`${item.src}-${at}`} className="shrink-0 snap-start">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => select(at)}
                  aria-current={at === current ? "true" : undefined}
                  aria-label={
                    item.kind === "video"
                      ? `Tampilkan rekaman ${at + 1}`
                      : `Tampilkan foto ${at + 1}`
                  }
                  className={cn(
                    "relative size-16 overflow-hidden rounded-md p-0 transition-opacity hover:bg-transparent",
                    at === current
                      ? "opacity-100 inset-ring-2 inset-ring-primary"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <RenderIf
                    when={item.kind === "video" ? item.poster : item.src}
                  >
                    {(src) => (
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </RenderIf>
                  <RenderIf when={item.kind === "video"}>
                    {() => (
                      <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-background">
                        <Play aria-hidden className="size-5 fill-current" />
                      </span>
                    )}
                  </RenderIf>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </RenderIf>
    </div>
  )
}
