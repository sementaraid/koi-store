import type { FormEvent } from "react"
import { Search } from "lucide-react"
import { cn } from "cn"

import { Input } from "@koi/ui"
import { DEFAULT_SEARCH_PLACEHOLDER } from "@/const/header"
import { ROUTES } from "@/const/routes"
import type { HeaderSearch } from "@/types/header"

/**
 * Filled search field, the one control the design draws as a field rather than
 * as a kit surface: no border, a recessed fill, and the icon inside it.
 *
 * With no `onSearch` the form does a native GET submit at the catalog, which is
 * the whole search feature: `/katalog?q=…` is a real page that queries the
 * catalog server-side, so the bar needs no handler, no state and no JavaScript
 * to work. With an `onSearch` the submit is prevented and the handler is handed
 * the trimmed query instead — an empty or whitespace query is dropped rather
 * than reported.
 *
 * @remarks
 * ponytail: a native submit is a full page navigation. Pass an `onSearch` that
 * `router.push`es the same URL from a client page once the catalog is worth
 * keeping warm across a search.
 */
export function SearchField({
  onSearch,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  className,
}: HeaderSearch & { className?: string }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = new FormData(event.currentTarget).get("q")?.toString().trim()
    if (query) onSearch?.(query)
  }

  return (
    <form
      role="search"
      aria-label="Cari koi"
      className={cn("relative flex min-w-0 items-center", className)}
      /* No handler: a plain GET at the catalog, which is a page that reads `q`.
         With one: prevented and handed over. */
      {...(onSearch
        ? { onSubmit: handleSubmit }
        : { action: ROUTES.catalogs, method: "get" })}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 size-[18px] text-muted-foreground"
      />
      <Input
        type="search"
        name="q"
        placeholder={searchPlaceholder}
        className="h-10 rounded-lg border-transparent bg-muted ps-9 shadow-[inset_0_1px_2px_oklch(0_0_0/5%)] focus-visible:bg-background"
      />
    </form>
  )
}
