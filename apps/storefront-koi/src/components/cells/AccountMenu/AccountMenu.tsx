import { Fragment } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

import { Button, RenderIf } from "@koi/ui"
import { Link } from "@/components/atoms/Link/Link"
import { Avatar, AvatarFallback, AvatarImage } from "@koi/ui/primitives/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@koi/ui/primitives/dropdown-menu"
import { DEFAULT_ACCOUNT_LINKS, GOLD_TEXT } from "@/const/header"
import { ROUTES } from "@/const/routes"
import { initials, sections } from "@/lib/helpers/header"
import type {
  HeaderAccount,
  HeaderAccountLink,
} from "@/types/header"

const SIGN_OUT_FORM_ID = "akun-keluar"

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
          <AvatarFallback className="bg-primary text-xs font-bold tracking-wider text-primary-foreground shadow-xs">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start text-left sm:flex">
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
            <RenderIf when={index > 0}>
              {() => <DropdownMenuSeparator />}
            </RenderIf>
            <DropdownMenuGroup>
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
              <RenderIf when={groups.length > 0}>
                {() => <DropdownMenuSeparator />}
              </RenderIf>
              {rows.map(Item)}
            </>
          )}
        </RenderIf>
      </DropdownMenuContent>

      <form id={SIGN_OUT_FORM_ID} method="post" action={ROUTES.signout} />
    </DropdownMenu>
  )
}

function Item({ label, href, icon: Icon, variant }: HeaderAccountLink) {
  const isSignout = href === ROUTES.signout;

  return (
    <DropdownMenuItem
      key={href}
      variant={variant}
      render={
        isSignout ? (
          <Button
            type="submit"
            form={SIGN_OUT_FORM_ID}
            variant="ghost"
            className="h-auto w-full justify-start bg-transparent px-0 py-0 hover:bg-transparent"
          />
        ) : (
          <Link href={href} />
        )
      }
      nativeButton={isSignout}
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
