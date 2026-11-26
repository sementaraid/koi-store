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

// The US-107 T-107.1 baseline: the bottom tab and header link each route marked
// before the shell moved into the layouts. Same literals as the nav's constants.
const bottom = ["/", "/lelang", "/katalog", "/akun/bid", "/akun"]
const header = ["/lelang", "/katalog", "/toko", "/mitra"]
const aliases = { "/katalog": ["/kategori", "/produk"] }

const baseline: [string, string | undefined, string | undefined][] = [
  // path, bottom tab (390), header link (1440)
  ["/", "/", undefined],
  ["/katalog", "/katalog", "/katalog"],
  ["/kategori", undefined, "/katalog"],
  ["/kategori/asagi", undefined, "/katalog"],
  ["/keranjang", undefined, undefined],
  ["/lelang", "/lelang", "/lelang"],
  ["/lelang/lot_01M7YRQP9J4VRF8KT6S286TCAX", "/lelang", "/lelang"],
  ["/mitra", undefined, "/mitra"],
  ["/mitra/aquatic-pro-shop", undefined, "/mitra"],
  ["/produk/asagi-konjo-tua", undefined, "/katalog"],
  ["/toko", undefined, "/toko"],
  ["/panduan", undefined, undefined],
  ["/rekber", undefined, undefined],
  ["/kontak", undefined, undefined],
  ["/syarat", undefined, undefined],
  ["/masuk", undefined, undefined],
  ["/daftar", undefined, undefined],
  ["/lupa-sandi", undefined, undefined],
  ["/atur-sandi", undefined, undefined],
  ["/akun", "/akun", undefined],
  ["/akun/alamat", "/akun", undefined],
  ["/akun/bid", "/akun/bid", undefined],
  ["/akun/kebun", "/akun", undefined],
  ["/akun/kebun/beranda", "/akun", undefined],
  ["/akun/kebun/terjual", "/akun", undefined],
  ["/akun/menang", "/akun", undefined],
  ["/akun/pengaturan", "/akun", undefined],
  ["/akun/pesanan", "/akun", undefined],
  ["/akun/pesanan/order_x", "/akun", undefined],
  ["/akun/saldo", "/akun", undefined],
  ["/akun/topup", "/akun", undefined],
  ["/akun/ulasan", "/akun", undefined],
  ["/tidak-ada", undefined, undefined],
  ["/mitra/tidak-ada", undefined, "/mitra"]
];

for (const [path, tab, link] of baseline) {
  test(`baseline ${path}: tab ${tab ?? "none"}, header ${link ?? "none"}`, () => {
    assert.equal(activeNavHref(path, bottom), tab)
    assert.equal(activeNavHref(path, header, aliases), link)
  })
}

test("an alias never steals a path from a longer own prefix", () => {
  assert.equal(
    activeNavHref("/katalog/produk/x", ["/katalog", "/katalog/produk"], { "/katalog": ["/produk"] }),
    "/katalog/produk"
  )
})

// A missing record renders the 404 card, whose shell turns the header mark off
// (`markActive={false}`); the tab still follows the pathname.
test("baseline 404s: the tab follows the path", () => {
  assert.equal(activeNavHref("/lelang/lot_tidak_ada", bottom), "/lelang")
  assert.equal(activeNavHref("/produk/tidak-ada", bottom), undefined)
  assert.equal(activeNavHref("/tidak-ada", bottom), undefined)
})
