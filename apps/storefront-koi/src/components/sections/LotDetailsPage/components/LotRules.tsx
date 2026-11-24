import { Ban, Gavel, Timer, Truck, Wallet, type LucideIcon } from "lucide-react"
import { Link } from "@/components/atoms/Link/Link"
import { SECTION_LABEL } from "@/const/layout"
import { ROUTES } from "@/const/routes"
import type { LotRule, LotRuleKind } from "@/lib/helpers/lot-rules"

const RULE_ICONS: Record<LotRuleKind, LucideIcon> = {
  "join-fee": Wallet,
  "bid-step": Gavel,
  extend: Timer,
  withdraw: Ban,
  payment: Truck,
}

// US-098 AC6: the current rules only, built from this auction's live values.
// Board 03/10 puts them on the page surface, not in a bordered card.
export function LotRules({ rules }: { rules: LotRule[] }) {
  return (
    <div className="flex flex-col gap-3 lg:gap-2">
      <h2 className={SECTION_LABEL}>Aturan lot ini</h2>

      <ul className="flex flex-col gap-3 text-sm leading-5 lg:gap-2">
        {rules.map((rule) => {
          const Icon = RULE_ICONS[rule.kind]
          return (
            <li key={rule.kind} className="flex gap-3">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-semibold text-foreground">{rule.title}</span>
                {rule.detail ? (
                  <span className="text-muted-foreground"> {rule.detail}</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>

      <Link
        href={ROUTES.guide}
        className="w-fit rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Baca aturan lengkap
      </Link>
    </div>
  )
}
