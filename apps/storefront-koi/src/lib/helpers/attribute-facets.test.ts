import assert from "node:assert/strict"
import { test } from "node:test"

import { facetHandles, readAttributeSelection } from "./attribute-facets.ts"
import type { AttributeFacet } from "../../types/product.ts"

const facets: AttributeFacet[] = [
  { handle: "bloodline", label: "Bloodline", values: ["Sakai", "Dainichi"] },
  { handle: "sertifikat", label: "Sertifikat", values: ["Ya", "Tidak"] },
]

test("reads only the handles the catalog offers a facet for", () => {
  assert.deepEqual(
    readAttributeSelection(facets, { bloodline: "Sakai", nonsense: "x" }),
    { bloodline: "Sakai" }
  )
})

test("an unknown param never reaches the API", () => {
  /* Medusa answers an unknown attribute filter with an empty feed, so a stale
     link must not be forwarded — it would read as "no koi in stock". */
  assert.deepEqual(readAttributeSelection(facets, { warna: "merah" }), {})
})

test("a feed's own keys are not facets, even if an attribute claims them", () => {
  assert.deepEqual(facetHandles([...facets, { handle: "sort", label: "S", values: [] }]), [
    "bloodline",
    "sertifikat",
  ])
  assert.deepEqual(readAttributeSelection([{ handle: "sort", label: "S", values: [] }], { sort: "price-asc" }), {})
})

test("a repeated param takes the first value", () => {
  assert.deepEqual(
    readAttributeSelection(facets, { bloodline: ["Sakai", "Dainichi"] }),
    { bloodline: "Sakai" }
  )
})

test("an empty value is not a narrowing", () => {
  assert.deepEqual(readAttributeSelection(facets, { bloodline: "" }), {})
  assert.deepEqual(readAttributeSelection(facets), {})
})
