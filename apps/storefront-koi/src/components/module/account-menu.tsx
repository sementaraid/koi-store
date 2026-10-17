import { Fragment } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/koi/button"
import { Link } from "@/components/koi/link"
import { RenderIf } from "@/components/module/render-if"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEFAULT_ACCOUNT_LINKS, GOLD_TEXT } from "@/components/constant/header"
import { initials, sections } from "@/components/helper/header"
import type {
  HeaderAccount,
  HeaderAccountLink,
} from "@/components/types/header"

/**
 * The profile dropdown: the account block *is* the trigger — face, name, tier,
 * caret read as one unit, and the popup anchors to it rather than to the bar
 * edge.
 *
 * Rows are drawn under their `group` heading, in first-seen order, with a rule
 * between sections; ungrouped rows fall to a trailing block under a rule of
 * their own — that is where sign-out sits.
 *
 * Desktop face only: below `lg` the account pages live in the bottom tab bar,
 * so the cluster shows the bell instead.
 */
export function AccountMenu({ account }: { account: HeaderAccount }) {
  const { user } = account
  const { groups, rest } = sections(account.menu ?? DEFAULT_ACCOUNT_LINKS)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={`Akun ${user.name}`}
            className="hidden h-auto gap-2 rounded-full py-1 ps-1 pe-1.5 lg:flex"
          />
        }
      >
        <Avatar>
          <RenderIf when={user.avatar}>
            {(src) => <AvatarImage src={src} alt="" />}
          </RenderIf>
          {/* Monogram ink is the brand fill's own foreground, which is what
              makes it legible on the primary circle — not a background ink. */}
          <AvatarFallback className="bg-primary text-xs font-bold tracking-wider text-primary-foreground shadow-xs">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start text-left sm:flex">
          {/* The one label on the bar that keeps full ink at rest: it is the
              person's name, not a destination, so it never recedes. Lifts to
              the brand accent on hover. The tier stays gold in both states —
              it is a rank, not a hover target. */}
          <span className="text-xs font-bold text-foreground transition-colors group-hover/button:text-accent-ink">
            {user.name}
          </span>
          <RenderIf when={user.role}>
            {(role) => (
              <span
                className={cn(
                  "text-2xs font-medium tracking-wider uppercase",
                  GOLD_TEXT
                )}
              >
                {role}
              </span>
            )}
          </RenderIf>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 text-muted-foreground transition-transform group-data-[popup-open]/button:rotate-180"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {groups.map(([label, items], index) => (
          <Fragment key={label}>
            {index > 0 && <DropdownMenuSeparator />}
            {/* Group gives the label its `aria-labelledby` wiring; the heading is
                a statement about the rows below it, not a row of its own. */}
            <DropdownMenuGroup>
              {/* Same voice as a footer column heading: quiet size, full ink,
                  uppercase tracking — the two menus are one house style. */}
              <DropdownMenuLabel className="text-xs font-bold tracking-wider text-foreground uppercase">
                {label}
              </DropdownMenuLabel>
              {items.map(Item)}
            </DropdownMenuGroup>
          </Fragment>
        ))}
        <RenderIf when={rest.length ? rest : null}>
          {(rows) => (
            <>
              {groups.length > 0 && <DropdownMenuSeparator />}
              {rows.map(Item)}
            </>
          )}
        </RenderIf>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** One row. `href` is the key: a menu is a set of destinations, and two rows to
    the same one are a mistake the list should collapse, not duplicate. */
function Item({ label, href, icon: Icon, variant }: HeaderAccountLink) {
  return (
    <DropdownMenuItem
      key={href}
      variant={variant}
      render={<Link href={href} />}
      /* The footer's row: quiet size, muted at rest, lifting to the brand
         accent under the pointer. The glyph rides the row's own ink so the two
         never split; destructive keeps its own. */
      className={cn(
        "text-xs text-muted-foreground transition-colors [&_svg]:text-current",
        variant !== "destructive" &&
          "focus:text-accent-ink not-data-[variant=destructive]:focus:**:text-accent-ink data-[highlighted]:text-accent-ink"
      )}
    >
      <RenderIf when={Icon}>{(Glyph) => <Glyph aria-hidden />}</RenderIf>
      {label}
    </DropdownMenuItem>
  )
}
