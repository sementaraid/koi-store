import assert from "node:assert/strict"
import { test } from "node:test"

import {
  facetHandles,
  facetLabel,
  facetValueLabel,
  readAttributeSelection,
  splitAttributeSelection,
} from "./attribute-facets.ts"
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

test("the English bloodline facet shows an Indonesian label", () => {
  assert.equal(facetLabel("bloodline", "Bloodline"), "Garis keturunan")
})

test("a label with no translation is shown as the API sent it", () => {
  assert.equal(facetLabel("sertifikat", "Sertifikat"), "Sertifikat")
})

test("the English local-bloodline value shows Indonesian, the query value stays", () => {
  assert.equal(facetValueLabel("bloodline", "Bloodline Lokal"), "Lokal")
  assert.equal(facetValueLabel("bloodline", "Sakai"), "Sakai")
  assert.equal(facetValueLabel("asal", "Bloodline Lokal"), "Bloodline Lokal")
})

test("splits variant axis values from product attribute values", () => {
  const splitFacets: AttributeFacet[] = [
    { handle: "ukuran", label: "Ukuran", values: ["25", "30"], is_variant_axis: true },
    { handle: "bloodline", label: "Bloodline", values: ["Sakai"], is_variant_axis: false },
  ]

  assert.deepEqual(
    splitAttributeSelection(splitFacets, { ukuran: "25", bloodline: "Sakai" }),
    { variantAxis: { ukuran: "25" }, productValues: { bloodline: "Sakai" } }
  )
})

test("a facet without the axis flag filters as a product value", () => {
  assert.deepEqual(splitAttributeSelection(facets, { bloodline: "Sakai" }), {
    variantAxis: {},
    productValues: { bloodline: "Sakai" },
  })
})
