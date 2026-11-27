import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { cn } from "cn"
import { Check, ChevronLeft, ChevronRight, Play, ZoomIn } from "lucide-react"

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  RenderIf,
} from "@koi/ui"
export type MediaItem = {
  src: string
  kind: "image" | "video"
  poster?: string
  // US-105 AC5 / US-098 AC12: a YouTube video plays through a
  // youtube-nocookie embed, not a native <video>.
  youtubeId?: string
}

export type MediaGalleryProps = {
  items: MediaItem[]
  index?: number
  onSelect?: (index: number) => void
  // The lot title, so every image names what it shows (US-098 AC7).
  title?: string
  overlay?: ReactNode
  /* Boards 03/10: the phone gallery runs edge to edge, the desktop one sits in
     the column. The thumbnail strip keeps the page edge either way. "wide"
     stays edge to edge through the `sm` gutter too (product page). */
  bleed?: "phone" | "wide"
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
  const [videoOpen, setVideoOpen] = useState(false)
  // A touch/pen swipe, tracked from pointerdown to pointerup (below).
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)

  if (!items.length) return null

  const current = Math.min(
    Math.max(0, controlled ? index : picked),
    items.length - 1
  )
  const active = items[current]
  const video = items.find((item) => item.youtubeId)

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

  /* Board 02: a horizontal flick on the stage steps the gallery. Only touch and
     pen start a gesture, so a mouse drag never moves it. A gesture switches only
     past 40 px and only when it travels further sideways than up or down, so a
     mostly vertical swipe stays the page scroll. The zoom Dialog portals outside
     this stage, so swiping the enlarged photo cannot reach these handlers. */
  const SWIPE_PX = 40
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (items.length < 2 || event.pointerType === "mouse") return
    // The zoom Dialog is portaled, but React still bubbles its events here. A
    // gesture must start inside this stage, never in the enlarged photo.
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) {
      return
    }
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current
    swipe.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return
    step(dx < 0 ? 1 : -1)
  }
  const onPointerCancel = () => {
    swipe.current = null
  }

  const alt =
    active.kind === "video"
      ? `${title ?? "Rekaman koi dari breeder"}, video ${current + 1} dari ${items.length}`
      : `${title ?? "Foto koi dari breeder"}, foto ${current + 1} dari ${items.length}`

  return (
    <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
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
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {/* A YouTube item shows a play stage; the Dialog closes on Esc and
              returns focus to the trigger (US-098 AC12). No autoplay. Literal
              trigger and popup ids skip React 19's `useId` replay, which
              otherwise hydrates a different id on this streaming page. The two
              triggers need distinct ids because both render while the video is
              active. */}
          <RenderIf when={active.kind === "video" && !!active.youtubeId}>
            {() => (
              <DialogTrigger
                id="media-video-trigger"
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label="Putar video"
                    className="flex size-full flex-col items-center justify-center gap-3 rounded-none hover:bg-transparent"
                  />
                }
              >
                <span
                  aria-hidden
                  className="flex size-16 items-center justify-center rounded-full bg-foreground/70 text-background"
                >
                  <Play className="size-7 fill-current" />
                </span>
                <span className="text-sm font-semibold">Putar video</span>
              </DialogTrigger>
            )}
          </RenderIf>

          <RenderIf when={active.kind === "video" && !active.youtubeId}>
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
                {/* Board 10: the desktop gallery steps with 44 px round arrows.
                    The phone gallery has no arrows (board 02); its thumbnails
                    and a horizontal swipe do the switching. */}
                <Button
                  type="button"
                  variant="soft"
                  size="icon-md"
                  aria-label="Media sebelumnya"
                  onClick={() => step(-1)}
                  className="absolute start-3 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-background/90 [&_svg:not([class*='size-'])]:size-5 hover:bg-background lg:inline-flex"
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  size="icon-md"
                  aria-label="Media berikutnya"
                  onClick={() => step(1)}
                  className="absolute end-3 top-1/2 hidden size-11 -translate-y-1/2 rounded-full bg-background/90 [&_svg:not([class*='size-'])]:size-5 hover:bg-background lg:inline-flex"
                >
                  <ChevronRight aria-hidden />
                </Button>
              </>
            )}
          </RenderIf>

          <span className="pointer-events-none absolute end-3 bottom-3 rounded-md bg-foreground/70 px-2 py-1 text-xs font-semibold text-background tabular-nums">
            {current + 1} / {items.length}
          </span>

          <RenderIf when={overlay}>
            {(node) => (
              <div className="pointer-events-none absolute bottom-3 start-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-end gap-3">
                {node}
              </div>
            )}
          </RenderIf>

          {/* US-098 AC12: "Perbesar" opens the photo in a Dialog. Base UI moves
              focus in, closes on Esc and returns it to this trigger. Literal ids
              keep the trigger and popup stable through React 19's `useId` replay;
              a gallery renders once per page. */}
          <RenderIf when={active.kind === "image"}>
            {() => (
              <Dialog>
                <DialogTrigger
                  id="media-zoom-trigger"
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Perbesar foto"
                      className="absolute start-2 bottom-2 z-10 size-10 rounded-full border-0 bg-background/90 px-0 shadow-none hover:bg-background lg:start-3 lg:bottom-3 lg:size-auto lg:h-9 lg:rounded-button lg:border lg:border-outline-edge lg:px-4 lg:shadow-button-outline [&_svg]:size-5 lg:[&_svg]:size-4"
                    />
                  }
                >
                  <ZoomIn aria-hidden />
                  <span className="hidden lg:inline">Perbesar</span>
                </DialogTrigger>
                <DialogContent
                  id="media-zoom-popup"
                  className="max-w-[min(96vw,72rem)] p-2 sm:p-3"
                >
                  <DialogTitle className="sr-only">{alt}</DialogTitle>
                  <img
                    src={active.src}
                    alt={alt}
                    className="max-h-[calc(100dvh-6rem)] w-full rounded-control object-contain"
                  />
                </DialogContent>
              </Dialog>
            )}
          </RenderIf>
        </div>

        <RenderIf when={items.length > 1}>
          {() => (
            <ul
              aria-label={title ? `Media ${title}` : "Media"}
              className={cn(
                "flex snap-x gap-2 overflow-x-auto pb-1",
                bleed === "wide" ? "px-4 sm:px-8 lg:px-0" : bleed && "px-4 lg:px-0"
              )}
            >
              {items.map((item, at) => (
                <li key={`${item.src}-${at}`} className="shrink-0 snap-start">
                  {/* The video tile sits after the photos and opens the embed
                      (US-098 AC12), labelled in Indonesian. */}
                  <RenderIf when={item.youtubeId}>
                    {() => (
                      <DialogTrigger
                        id="media-video-trigger-thumb"
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => select(at)}
                            aria-current={at === current ? "true" : undefined}
                            aria-label="Putar video"
                            className={cn(
                              "relative h-12 w-16 overflow-hidden rounded-control bg-price-panel p-0 text-price-panel-foreground hover:bg-price-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:h-18 lg:w-24 lg:rounded-xl",
                              at === current
                                ? "border-2 border-primary"
                                : "border border-divider"
                            )}
                          />
                        }
                      >
                        <span className="flex size-full flex-col items-center justify-center gap-0.5">
                          <Play aria-hidden className="size-4 fill-current lg:size-5" />
                          <span className="text-[12px] font-semibold">Video</span>
                        </span>
                        {/* US-098 AC12: the current thumbnail is marked with an
                            icon, not only the border colour. */}
                        <RenderIf when={at === current}>
                          {() => (
                            <span className="pointer-events-none absolute end-1 top-1 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check aria-hidden className="size-3" />
                            </span>
                          )}
                        </RenderIf>
                      </DialogTrigger>
                    )}
                  </RenderIf>
                  <RenderIf when={!item.youtubeId}>
                    {() => (
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
                        {/* US-098 AC12: the current thumbnail is marked with an
                            icon, not only the border colour. */}
                        <RenderIf when={at === current}>
                          {() => (
                            <span className="pointer-events-none absolute end-1 top-1 z-10 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check aria-hidden className="size-3" />
                            </span>
                          )}
                        </RenderIf>
                      </Button>
                    )}
                  </RenderIf>
                </li>
              ))}
            </ul>
          )}
        </RenderIf>
      </div>

      <RenderIf when={video}>
        {(item) => (
          <DialogContent
            id="media-video-popup"
            className="max-w-[min(96vw,56rem)] p-2 sm:p-3"
          >
            <DialogTitle className="sr-only">
              {title ? `Video ${title}` : "Video lot"}
            </DialogTitle>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${item.youtubeId}?rel=0`}
              title={title ? `Video ${title}` : "Video lot"}
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded-control"
            />
          </DialogContent>
        )}
      </RenderIf>
    </Dialog>
  )
}
