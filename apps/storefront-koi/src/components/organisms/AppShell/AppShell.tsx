import type { ReactNode } from "react"

import { BottomNav } from "@/components/cells/BottomNav/BottomNav"
import { Footer } from "@/components/organisms/Footer/Footer"
import { Header } from "@/components/organisms/Header/Header"
import type { HeaderAccount, HeaderCart } from "@/types/header"

import { ShellBalanceProvider } from "./BalanceSync"

export type AppShellProps = {
  account?: HeaderAccount
  cart?: HeaderCart
  /* The 404 card names no section, so its header marks no item. */
  markActive?: boolean
  children: ReactNode
}

/**
 * The page chrome, rendered once by each route group's layout (US-107). A page
 * varies it only by rendering a marker element the rules below match with
 * `:has()`, so the first server-rendered HTML is already right:
 * - `data-shell="lot-header"`: the lot page's own mobile header replaces the shell
 *   header below `lg`.
 * - `data-shell="lot-bar"`: the lot page's bid bar shows, so the bottom space
 *   covers the bar as well as the tab bar below `lg`.
 */
export function AppShell({
  account,
  cart,
  markActive = true,
  children
}: AppShellProps) {
  return (
    <div
      data-slot="shell"
      className="group/shell flex min-h-svh flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] has-[[data-shell=lot-bar]]:pb-[calc(12.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:has-[[data-shell=lot-bar]]:pb-0"
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-xs focus:shadow-lg"
      >
        Lewati ke konten
      </a>

      <Header account={account} cart={cart} markActive={markActive} />

      <main id="konten" className="flex-1">
        <ShellBalanceProvider balance={account?.balance}>{children}</ShellBalanceProvider>
      </main>

      <Footer />

      <BottomNav signedIn={Boolean(account)} />
    </div>
  )
}
