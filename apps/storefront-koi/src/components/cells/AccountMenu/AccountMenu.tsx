"use client"

import { Fragment } from "react"
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
import { DEFAULT_ACCOUNT_LINKS } from "@/const/header"
import { ROUTES } from "@/const/routes"
import { useSignOut } from "@/hooks/use-sign-out"
import { initials, sections } from "@/lib/helpers/header"
import type {
  HeaderAccount,
  HeaderAccountLink,
} from "@/types/header"

/* The shell is streamed ahead of the page's Suspense boundary. React 19 derives
   a hidden `useId` for the Base UI trigger from that streamed tree, and the id
   it computes on the client can differ from the one the server wrote into the
   HTML (the upstream replay bug). An explicit id skips `useId` and keeps the
   trigger, its panel and the focus guards stable across the two renders. */
const MENU_TRIGGER_ID = "akun-menu-trigger"
const MENU_POPUP_ID = "akun-menu-popup"

export function AccountMenu({ account }: { account: HeaderAccount }) {
  const { user } = account
  const { groups, rest } = sections(account.menu ?? DEFAULT_ACCOUNT_LINKS)
  const { signOut } = useSignOut()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={MENU_TRIGGER_ID}
        render={
          <Button
            variant="ghost"
            size="icon-md"
            aria-label={`Akun ${user.name}`}
            className="hidden rounded-full p-0 lg:inline-flex"
          />
        }
      >
        {/* US-103 AC9: just the initials; the name lives in the aria-label. */}
        <Avatar size="lg">
          <RenderIf when={user.avatar}>
            {(src) => <AvatarImage src={src} alt="" />}
          </RenderIf>
          <AvatarFallback className="bg-surface text-sm font-bold text-foreground">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent id={MENU_POPUP_ID} align="end" className="w-60">
        {groups.map(([label, items], index) => (
          <Fragment key={label}>
            <RenderIf when={index > 0}>
              {() => <DropdownMenuSeparator />}
            </RenderIf>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-bold tracking-wider text-foreground uppercase">
                {label}
              </DropdownMenuLabel>
              {items.map((item) => (
                <Item key={item.href} {...item} onSignOut={signOut} />
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
        <RenderIf when={rest.length ? rest : null}>
          {(rows) => (
            <>
              <RenderIf when={groups.length > 0}>
                {() => <DropdownMenuSeparator />}
              </RenderIf>
              {rows.map((item) => (
                <Item key={item.href} {...item} onSignOut={signOut} />
              ))}
            </>
          )}
        </RenderIf>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Item({
  label,
  href,
  icon: Icon,
  variant,
  onSignOut
}: HeaderAccountLink & { onSignOut?: () => void }) {
  const isSignout = href === ROUTES.signout;

  return (
    <DropdownMenuItem
      variant={variant}
      onClick={isSignout ? onSignOut : undefined}
      render={
        isSignout ? (
          <Button
            type="button"
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
