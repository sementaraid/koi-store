import { Fish } from "lucide-react"

import { Link } from "@/components/koi/link"
import { RenderIf } from "@/components/module/render-if"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { HeaderBrand } from "@/components/types/header"

/**
 * The brand mark: the design's logo is a photo and a name, so the photo carries
 * it alone, with a glyph standing in until a `brandIcon` arrives.
 */
export function BrandMark({ brandIcon, brandHref }: HeaderBrand) {
  return (
    <Link
      href={brandHref}
      aria-label="Beranda"
      className="shrink-0 rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {/* Accent *ink*, not the fill: the glyph sits on the fill's own tint, and
          at fill strength the navy swallows its own mark. */}
      <Avatar size="lg" className="bg-primary/10 text-accent-ink">
        <RenderIf when={brandIcon}>
          {(src) => <AvatarImage src={src} alt="" />}
        </RenderIf>
        <AvatarFallback className="bg-transparent">
          <Fish aria-hidden className="size-5" />
        </AvatarFallback>
      </Avatar>
    </Link>
  )
}
