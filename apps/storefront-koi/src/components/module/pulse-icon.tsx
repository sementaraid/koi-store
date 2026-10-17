/** Small live pulse, carried by whatever entry the nav marks `live`. */
export function PulseIcon() {
  return (
    <span aria-hidden data-slot="pulse" className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live-ink opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-live-ink" />
    </span>
  )
}
