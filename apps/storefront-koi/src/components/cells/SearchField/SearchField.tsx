import type { FormEvent } from "react"
import { Search } from "lucide-react"
import { cn } from "cn"

import { Input } from "@koi/ui"
import { DEFAULT_SEARCH_PLACEHOLDER } from "@/const/header"
import { ROUTES } from "@/const/routes"
import type { HeaderSearch } from "@/types/header"

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
