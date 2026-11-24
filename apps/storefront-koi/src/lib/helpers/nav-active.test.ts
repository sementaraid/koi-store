import assert from "node:assert/strict"
import { test } from "node:test"

import { activeNavHref } from "./nav-active.ts"

const hrefs = ["/", "/lelang", "/katalog", "/akun/bid", "/akun"]

test("the root only matches itself", () => {
  assert.equal(activeNavHref("/", hrefs), "/")
  assert.equal(activeNavHref("/lelang", hrefs), "/lelang")
})

test("a child route colours its section", () => {
  assert.equal(activeNavHref("/lelang/abc", hrefs), "/lelang")
  assert.equal(activeNavHref("/katalog/koi", hrefs), "/katalog")
})

test("the deepest match wins, so Bid Saya beats Akun", () => {
  assert.equal(activeNavHref("/akun/bid", hrefs), "/akun/bid")
  assert.equal(activeNavHref("/akun/bid/selesai", hrefs), "/akun/bid")
  assert.equal(activeNavHref("/akun/alamat", hrefs), "/akun")
})

test("ignores query and hash and returns undefined with no match", () => {
  assert.equal(activeNavHref("/lelang?status=live", hrefs), "/lelang")
  assert.equal(activeNavHref("/masuk", hrefs), undefined)
})
