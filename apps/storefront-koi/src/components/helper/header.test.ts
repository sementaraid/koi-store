import { initials, sections } from "./header.ts"
import type { HeaderAccountLink } from "@/components/types/header"
import assert from "node:assert/strict"
import { test } from "node:test"

test("monograms the first two words", () => {
  assert.equal(initials("Bpk. Hendra S."), "BH")
  assert.equal(initials("  Siti  "), "S")
  assert.equal(initials(""), "")
})

/* The drawn order is the caller's order — `Map` keeps insertion — and the
   ungrouped rows must not vanish into a section. */
test("keeps first-seen order, splits ungrouped rows off last", () => {
  const link = (label: string, group?: string): HeaderAccountLink => ({
    label,
    href: `/${label}`,
    group,
  })
  const { groups, rest } = sections([
    link("a", "Satu"),
    link("b", "Dua"),
    link("c", "Satu"),
    link("Keluar"),
  ])

  assert.deepEqual(
    groups.map(([group, items]) => [group, items.map((i) => i.label)]),
    [
      ["Satu", ["a", "c"]],
      ["Dua", ["b"]],
    ]
  )
  assert.deepEqual(
    rest.map((i) => i.label),
    ["Keluar"]
  )
})
