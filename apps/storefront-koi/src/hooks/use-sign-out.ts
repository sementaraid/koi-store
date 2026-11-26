"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { ROUTES } from "@/const/routes"
import { signOut } from "@/lib/data/customer"

/**
 * US-107 AC7: clear the session, then refetch the layouts so the header chip
 * and the account menu disappear, and land on the home page. A client
 * navigation keeps the document (and `window.__marker`) alive; posting a form
 * to `/keluar` would reload it.
 */
export function useSignOut() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const run = () =>
    startTransition(async () => {
      await signOut()
      router.push(ROUTES.home)
      router.refresh()
    })

  return { signOut: run, pending }
}
