import assert from "node:assert/strict"
import { test } from "node:test"

import { feeCategoryLabel } from "./fee-category-label.ts"

test("the seeded English fee categories are shown in Indonesian", () => {
  assert.equal(feeCategoryLabel("Lokal, no certificate"), "Lokal, tanpa sertifikat")
  assert.equal(feeCategoryLabel("Lokal, certificate"), "Lokal, bersertifikat")
  assert.equal(feeCategoryLabel("Import, certificate"), "Impor, bersertifikat")
})

test("a name with no translation is left unchanged", () => {
  assert.equal(feeCategoryLabel("Khusus, sertifikat"), "Khusus, sertifikat")
  assert.equal(feeCategoryLabel(""), "")
})
