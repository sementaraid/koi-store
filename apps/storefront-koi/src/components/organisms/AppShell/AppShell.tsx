import type { ReactNode } from "react"

import { BottomNav } from "@/components/cells/BottomNav/BottomNav"
import { Footer } from "@/components/organisms/Footer/Footer"
import { Header } from "@/components/organisms/Header/Header"
import type { HeaderAccount } from "@/types/header"

import { ShellBalanceProvider } from "./BalanceSync"

export type AppShellProps = {
  account?: HeaderAccount
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
 * - `data-shell="lot-page"`: the lot page renders it in every state. Its tab bar
 *   is gone (US-099 AC14), so the shell drops the tab bar's reserved space.
 * - `data-shell="lot-bar"`: the lot page's sticky footer shows. The bottom space
 *   then reserves the footer's measured height (`--lot-bar-h`, set by
 *   `LotPriceBar`) and nothing else.
 */
export function AppShell({
  account,
  markActive = true,
  children
}: AppShellProps) {
  return (
    <div
      data-slot="shell"
      className="group/shell flex min-h-svh flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] has-[[data-shell=lot-page]]:pb-0 has-[[data-shell=lot-page]]:has-[[data-shell=lot-bar]]:pb-[var(--lot-bar-h,calc(14.5rem+env(safe-area-inset-bottom)))] lg:pb-0"
    >
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-xs focus:shadow-lg"
      >
        Lewati ke konten
      </a>

      <Header account={account} markActive={markActive} />

      <main id="konten" className="flex-1">
        <ShellBalanceProvider balance={account?.balance}>{children}</ShellBalanceProvider>
      </main>

      <Footer />

      <BottomNav signedIn={Boolean(account)} />
    </div>
  )
}
