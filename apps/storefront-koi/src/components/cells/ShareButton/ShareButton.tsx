"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { cn } from "cn"

import { Button } from "@koi/ui"

/* US-098 AC11: the device share sheet where the browser has one, otherwise the
   lot URL on the clipboard. The live region is always mounted so a screen
   reader hears "Tautan disalin" when it changes. No heart beside it (D-066). */
export function ShareButton({
  title,
  url,
  className,
  iconOnly,
}: {
  title?: string
  url?: string
  className?: string
  /* Board 03: the phone's own lot header carries the share action as a 44 px
     icon, where "Bagikan" would crowd the lot number. */
  iconOnly?: boolean
}) {
  const [message, setMessage] = useState("")

  async function share() {
    const target = url
      ? new URL(url, window.location.origin).toString()
      : window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, url: target })
        return
      } catch (error) {
        // The reader dismissed the sheet: not a failure, say nothing.
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(target)
      setMessage("Tautan disalin")
    } catch {
      setMessage("Tautan tidak bisa disalin. Salin dari bilah alamat.")
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {iconOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-md"
          aria-label="Bagikan"
          onClick={() => void share()}
        >
          <Share2 aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void share()}
          className="min-h-11 py-2"
        >
          <Share2 aria-hidden />
          Bagikan
        </Button>
      )}
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "text-xs text-muted-foreground",
          message ? "inline" : "sr-only"
        )}
      >
        {message}
      </span>
    </div>
  )
}
