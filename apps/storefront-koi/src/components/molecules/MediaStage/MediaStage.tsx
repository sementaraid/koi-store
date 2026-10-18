import { useState, type ReactNode } from "react"
import { cn } from "cn"

import { Button } from "@/components/atoms/Button/Button"
import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"
import {
  MediaGallery,
  type MediaItem,
} from "@/components/cells/MediaGallery/MediaGallery"

export type { MediaItem }

/** The stage's own switch: the breeder's stills, or the clip. Drawn only when
    the lot carries both — a tab strip over one kind is a control that cannot
    change anything. */
const MEDIA_TABS = [
  { value: "image", label: "Foto" },
  { value: "video", label: "Video" },
] as const

/** Props for {@link MediaStage}. */
export type MediaStageProps = {
  /** The lot's media, in display order. Empty renders nothing. */
  items: MediaItem[]
  /** Anything the surface puts over the viewer's lower edge — a live room's
      "just bid" line, say. Omitted, the viewer is bare. */
  overlay?: ReactNode
  className?: string
}

/**
 * The lot's media, with the two things a viewer over a photo needs on it:
 * which kind is showing, and where in the set it is.
 *
 * @remarks
 * A switch, not a filter: picking "Video" opens the first clip rather than
 * hiding the stills, so the strip under it keeps every item one pick away.
 *
 * ponytail: no lightbox. `Perbesar` in the reference needs a full-screen
 * viewer; add it when the kit has one to open, not as a button that does
 * nothing.
 */
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
                  /* A pill over the photo, not a toned surface: `Button` is
                     here for its focus ring and press spring, with its own
                     fill and sizing given up for this one's translucent
                     glass look. */
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
