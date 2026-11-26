import type { ReactNode } from "react"
import { Ban, CalendarClock, CircleCheck, Clock, TrendingDown } from "lucide-react"

import { Badge } from "@koi/ui"
import type { Chip, ChipIcon } from "@/lib/helpers/lot-card"

const ICONS: Record<ChipIcon, ReactNode> = {
  // The live chip is a dot plus the word, as on the boards; the others stay icons.
  live: <span className="size-1.5 rounded-full bg-current" />,
  clock: <Clock />,
  calendar: <CalendarClock />,
  done: <CircleCheck />,
  cancelled: <Ban />,
  highest: <CircleCheck />,
  outbid: <TrendingDown />,
}

// One status chip for both the lot card and the lot page, so the icon and tone
// of "Live", "Berakhir < 1 jam" and the rest never drift apart.
export function LotChip({ chip, className }: { chip: Chip; className?: string }) {
  return (
    <Badge variant={chip.tone} icon={ICONS[chip.icon]} className={className}>
      {chip.label}
    </Badge>
  )
}
