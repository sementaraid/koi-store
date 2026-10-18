import { useState, type ReactNode } from "react"
import { cn } from "cn"
import { Play } from "lucide-react"

import { Button } from "@/components/atoms/Button/Button"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"

/** One item in a gallery: a still, or a clip the breeder recorded. */
export type MediaItem = {
  /** The photo, or the clip's file. */
  src: string
  kind: "image" | "video"
  /** Clip cover, so the viewer is not a black rectangle before it plays. */
  poster?: string
}

/** Props for {@link MediaGallery}. */
export type MediaGalleryProps = {
  /** The lot's media, in display order. Empty renders nothing. */
  items: MediaItem[]
  /** Starting item, caller-owned. @defaultValue the first */
  index?: number
  /** Called with the index the visitor picked, when they pick one. */
  onSelect?: (index: number) => void
  /** Anything the surface puts over the viewer's lower edge — a live room's
      "just bid" line, say. It rides inside the frame, not the gallery, so it
      cannot sit on the thumbnails the visitor navigates by. */
  overlay?: ReactNode
  className?: string
}

/**
 * The lot's media: one viewer, and a strip of thumbnails under it — so a
 * breeder's clip of the koi sits beside their stills instead of being a link
 * away.
 *
 * A clip plays in place, with native controls and sound on. The viewer is
 * `aspect-16/10`, a photo's shape: a portrait clip is letterboxed inside it
 * rather than stretching the stage each time one is picked.
 *
 * @remarks
 * `index` is the caller's whenever they pass one, and `undefined` is what tells
 * this component it is uncontrolled — not `0`, which is a real index. Either
 * way the pick is reported through `onSelect`.
 *
 * @example
 * <MediaGallery
 *   items={[
 *     { kind: "image", src: photo },
 *     { kind: "video", src: clip, poster: cover },
 *   ]}
 * />
 */
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

  /* Clamped, so a caller that keeps the index while the lot's media changes
     under it gets the last item rather than a viewer showing nothing. */
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
        {/* Keyed on the src: React reuses one DOM node across items, and a node
            that keeps playing a clip the visitor has navigated away from is the
            one way this reads as broken. Remount stops the old clip.

            The two kinds are different elements, not one `<video>` handed a
            photo: a `<video src="…jpg">` decodes to a blank frame, so a still
            in the strip would open on nothing. `object-contain` on both keeps a
            portrait clip or photo letterboxed inside the same 16/10 box. */}
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

        {/* Inside the frame, not over the stack: the thumbnails under it are how
            the visitor changes what they are looking at, and a bar laid across
            them is a control that stops working when a bid lands. Pinned to the
            bottom-start corner and sized to its content, so it never sits over
            the middle of the koi. */}
        <RenderIf when={overlay}>
          {(node) => (
            <div className="pointer-events-none absolute bottom-3 start-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-end gap-3">
              {node}
            </div>
          )}
        </RenderIf>
      </div>

      {/* A strip of picks, not a control group: the thumbnails choose what the
          viewer shows, and the viewer is where a clip is played. */}
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
                  /* A picture tile, not a control surface: `Button` is here for
                     its focus ring and press spring, so the fill, padding and
                     sizing it would otherwise bring are all given up. */
                  className={cn(
                    "relative size-16 overflow-hidden rounded-md p-0 transition-opacity hover:bg-transparent",
                    at === current
                      ? "opacity-100 inset-ring-2 inset-ring-primary"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {/* A clip is represented by its cover; one that arrived without
                      a poster gets the glyph on a plain tile rather than a broken
                      image element. */}
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
