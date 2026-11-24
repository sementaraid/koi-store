import { useState, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "cn"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"

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
  // The lot title, so every image names what it shows (US-098 AC7).
  title?: string
  overlay?: ReactNode
  /* Boards 03/10: the phone gallery runs edge to edge, the desktop one sits in
     the column. The thumbnail strip keeps the page edge either way. */
  bleed?: boolean
  className?: string
}

export function MediaGallery({
  items = [],
  index,
  onSelect,
  title,
  overlay,
  bleed,
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
  const step = (delta: number) =>
    select((current + delta + items.length) % items.length)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (items.length < 2) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      step(-1)
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      step(1)
    }
  }

  const alt =
    active.kind === "video"
      ? `${title ?? "Rekaman koi dari breeder"}, video ${current + 1} dari ${items.length}`
      : `${title ?? "Foto koi dari breeder"}, foto ${current + 1} dari ${items.length}`

  return (
    <div
      data-slot="media-gallery"
      className={cn("flex w-full flex-col gap-2", className)}
    >
      <div
        className={cn(
          "relative flex aspect-4/3 w-full items-center justify-center overflow-hidden bg-surface",
          bleed ? "rounded-none lg:rounded-control" : "rounded-control"
        )}
        onKeyDown={onKeyDown}
      >
        <RenderIf when={active.kind === "video"}>
          {() => (
            <video
              key={active.src}
              src={active.src}
              poster={active.poster}
              aria-label={alt}
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
              alt={alt}
              className="size-full object-cover"
            />
          )}
        </RenderIf>

        <RenderIf when={items.length > 1}>
          {() => (
            <>
              <Button
                type="button"
                variant="soft"
                size="icon-md"
                aria-label="Media sebelumnya"
                onClick={() => step(-1)}
                className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 [&_svg:not([class*='size-'])]:size-5"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="soft"
                size="icon-md"
                aria-label="Media berikutnya"
                onClick={() => step(1)}
                className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-background/90 [&_svg:not([class*='size-'])]:size-5"
              >
                <ChevronRight aria-hidden />
              </Button>
            </>
          )}
        </RenderIf>

        <span className="pointer-events-none absolute end-3 bottom-3 rounded-badge bg-foreground/70 px-2 py-1 text-xs font-semibold text-background tabular-nums">
          {current + 1} / {items.length}
        </span>

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
            className={cn(
              "flex snap-x gap-2 overflow-x-auto pb-1",
              bleed && "px-4 lg:px-0"
            )}
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
                    "relative h-12 w-16 overflow-hidden rounded-control p-0 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:h-18 lg:w-24",
                    at === current
                      ? "border-2 border-primary"
                      : "border border-divider hover:border-input"
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
                        <Play aria-hidden className="size-4 fill-current" />
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
