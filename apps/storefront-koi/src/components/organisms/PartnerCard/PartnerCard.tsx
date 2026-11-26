import type { ComponentProps } from "react"
import { cn } from "cn"
import { BadgeCheck, Star } from "lucide-react"

import { TILE } from "@koi/ui/surface"
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"

export type PartnerFact = {
  value: string
  label: string
}

export type PartnerFarm = {
  id: string
  name: string
  location?: string
  rating?: number
  facts?: PartnerFact[]
  speciality?: string
  href: string
}

export type PartnerCardProps = ComponentProps<typeof Card> & {
  partner: PartnerFarm
}

export function PartnerCard({
  partner,
  className,
  ...props
}: PartnerCardProps) {
  const { name, location, rating, facts, speciality, href } = partner

  return (
    <Card
      data-slot="partner-card"
      size="sm"
      variant="flat"
      className={cn("w-full ring-0", TILE, className)}
      {...props}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-accent-ink"
          >
            {name.charAt(0)}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <CardTitle className="flex items-center gap-1.5">
              <Link
                href={href}
                className="truncate rounded-sm transition-colors hover:text-accent-ink hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 max-md:-my-3 max-md:py-3"
              >
                {name}
              </Link>
              <BadgeCheck
                role="img"
                aria-label="Terverifikasi"
                className="size-4 shrink-0 text-accent-ink"
              />
            </CardTitle>
            <RenderIf when={location}>
              {(where) => (
                <CardDescription className="truncate text-xs">
                  {where}
                </CardDescription>
              )}
            </RenderIf>
          </div>

          <RenderIf when={rating}>
            {(score) => (
              <span className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums">
                <Star
                  aria-hidden
                  className="size-3.5 fill-gold-ink text-gold-ink"
                />
                {score.toFixed(2)}
              </span>
            )}
          </RenderIf>
        </div>
      </CardHeader>

      <RenderIf when={facts?.length ? facts : undefined}>
        {(rows) => (
          <CardContent>
            <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 px-2 py-2 text-center">
              {rows.map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <dt className="order-2 text-2xs text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-xs font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        )}
      </RenderIf>

      <CardFooter className="mt-auto justify-between gap-3">
        <span className="min-w-0 truncate text-2xs text-muted-foreground">
          <RenderIf when={speciality}>{(what) => <>Spesialis: {what}</>}</RenderIf>
        </span>
        <Button
          size="sm"
          variant="soft"
          render={<Link href={href} />}
          nativeButton={false}
          className="shrink-0 max-md:after:-inset-y-2"
        >
          Kunjungi Kolam
        </Button>
      </CardFooter>
    </Card>
  )
}
