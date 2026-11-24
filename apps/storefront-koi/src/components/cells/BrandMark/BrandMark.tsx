import { Fish } from "lucide-react"

import { Link } from "@/components/atoms/Link/Link"
import { RenderIf } from "@koi/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@koi/ui/primitives/avatar"
import type { HeaderBrand } from "@/types/header"

export function BrandMark({ brandIcon, brandHref }: HeaderBrand) {
  return (
    <Link
      href={brandHref}
      aria-label="Beranda"
      className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
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
