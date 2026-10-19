import type { ReactNode } from "react"
import type { ShieldCheck } from "lucide-react"

import { RenderIf } from "@/components/atoms/RenderIf/RenderIf"

/** Props for {@link TrustLine}. */
export type TrustLineProps = {
  icon: typeof ShieldCheck
  title: string
  body: string
  /** A link or control the claim carries, e.g. the escrow regulation. Omitted,
      the line is copy alone. */
  action?: ReactNode
}

/** One line of what backs the money: a glyph, a claim, and its condition. */
export function TrustLine({ icon: Icon, title, body, action }: TrustLineProps) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
      <p className="min-w-0 text-xs leading-snug text-pretty">
        <strong className="font-bold">{title}</strong>{" "}
        <span className="text-muted-foreground">{body}</span>{" "}
        <RenderIf when={action}>{(node) => node}</RenderIf>
      </p>
    </li>
  )
}
