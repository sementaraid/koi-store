import type { HeaderAccountLink } from "@/types/header"

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

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
