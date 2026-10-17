import type { HeaderAccountLink } from "@/components/types/header"

/** `"Bpk. Hendra S."` → `"BH"` — the design shows a monogram, so the name gives one. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * Splits the account menu into headed sections and the unheaded rest.
 *
 * @remarks
 * `Map` keeps first-seen order, so the caller's list order is the drawn order,
 * and one label is enough to describe several non-adjacent rows. Ungrouped rows
 * are collected rather than assumed to be last: the list stays in the caller's
 * order, and the drawing decides where the trailing block goes.
 */
export function sections(links: HeaderAccountLink[]) {
  const headed = new Map<string, HeaderAccountLink[]>()
  const rest: HeaderAccountLink[] = []

  for (const link of links) {
    if (!link.group) {
      rest.push(link)
      continue
    }
    const items = headed.get(link.group)
    if (items) items.push(link)
    else headed.set(link.group, [link])
  }

  return { groups: [...headed] as [string, HeaderAccountLink[]][], rest }
}
