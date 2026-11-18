import { Bell } from "lucide-react"

import { Button, RenderIf } from "@koi/ui"
import { AccountMenu } from "./AccountMenu"
import type { HeaderAccount } from "@/types/header"

export function AccountCluster({ account }: { account: HeaderAccount }) {
  const { unread, onNotificationsClick } = account

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-md"
        onClick={onNotificationsClick}
        aria-label="Notifikasi bidding & transaksi"
        title="Notifikasi bidding & transaksi"
        className="relative text-foreground hover:text-accent-ink lg:hidden"
      >
        <Bell aria-hidden className="size-5" />
        <RenderIf when={unread}>
          {() => (
            <span className="absolute end-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-card" />
          )}
        </RenderIf>
      </Button>

      <AccountMenu account={account} />
    </>
  )
}
