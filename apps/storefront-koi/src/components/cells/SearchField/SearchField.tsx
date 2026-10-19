import type { FormEvent } from "react"
import { Search } from "lucide-react"
import { cn } from "cn"

import { Input } from "@/components/atoms/Input/Input"
import { DEFAULT_SEARCH_PLACEHOLDER } from "@/const/header"
import type { HeaderSearch } from "@/types/header"

/**
 * Filled search field, the one control the design draws as a field rather than
 * as a kit surface: no border, a recessed fill, and the icon inside it.
 *
 * With no `onSearch` the form falls through to a native GET submit; with one it
 * is prevented and handed the trimmed query — an empty or whitespace query is
 * dropped rather than reported.
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
      aria-label="Cari lot"
      className={cn("relative flex min-w-0 items-center", className)}
      onSubmit={onSearch ? handleSubmit : undefined}
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
