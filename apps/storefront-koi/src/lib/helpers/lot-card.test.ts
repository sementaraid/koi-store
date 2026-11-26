import assert from "node:assert/strict"
import { test } from "node:test"

import {
  formatBarCountdown,
  formatBidCount,
  formatEndTime,
  formatLotCountdown,
  formatLotNumber,
  formatTimeLeft,
  lotCardSubtitle,
  lotClosedLabel,
  closedPriceLabel,
  lotJoinNote,
  lotPriceLine,
  lotStatusChip,
  viewerPositionChip,
} from "./lot-card.ts"

test("card subtitle reads age, sex and farm, dropping empty parts", () => {
  assert.equal(
    lotCardSubtitle({ age: "Sansai (3 tahun)", sex: "Betina", seller: "Sakura Koi Farm" }),
    "Sansai (3 tahun) · Betina · Sakura Koi Farm"
  )
  assert.equal(lotCardSubtitle({ sex: "Jantan", seller: "Sakura Koi Farm" }), "Jantan · Sakura Koi Farm")
  assert.equal(lotCardSubtitle({ seller: "Sakura Koi Farm" }), "Sakura Koi Farm")
  assert.equal(lotCardSubtitle({}), undefined)
})

test("lot number is zero-padded to two digits", () => {
  assert.equal(formatLotNumber(7), "Lot #07")
  assert.equal(formatLotNumber(12), "Lot #12")
  assert.equal(formatLotNumber(123), "Lot #123")
})

test("bid count reads in Indonesian, with a no-bid wording", () => {
  assert.equal(formatBidCount(3), "3 bid")
  assert.equal(formatBidCount(1), "1 bid")
  assert.equal(formatBidCount(0), "Belum ada bid")
})

test("end time is Jakarta time with weekday and WIB", () => {
  // 2026-11-24 is a Tuesday; 13:00Z is 20.00 WIB
  assert.equal(formatEndTime("2026-11-24T13:00:00Z"), "Sel 24 Nov, 20.00 WIB")
  // past midnight in Jakarta rolls the date and the weekday
  assert.equal(formatEndTime("2026-11-24T17:30:00Z"), "Rab 25 Nov, 00.30 WIB")
})

test("end time can carry the year and a long weekday", () => {
  assert.equal(
    formatEndTime("2026-11-24T13:00:00Z", { year: true }),
    "Sel 24 Nov 2026, 20.00 WIB"
  )
  assert.equal(
    formatEndTime("2026-11-24T13:00:00Z", { year: true, weekday: "long" }),
    "Selasa, 24 Nov 2026, 20.00 WIB"
  )
})

test("lot countdown is mm:ss under an hour, then hours or days", () => {
  assert.equal(formatLotCountdown(38 * 60_000 + 12_000), "38:12")
  assert.equal(formatLotCountdown(9_000), "00:09")
  assert.equal(formatLotCountdown(0), "00:00")
  assert.equal(formatLotCountdown(-1), "00:00")
  assert.equal(formatLotCountdown(60 * 60_000), "1 jam")
  assert.equal(formatLotCountdown(2 * 60 * 60_000 + 5 * 60_000), "2 jam")
  assert.equal(formatLotCountdown(25 * 60 * 60_000), "1 hari")
})

test("bar countdown adds hours to days, then HH.MM, then MM:SS", () => {
  assert.equal(formatBarCountdown(38 * 60_000 + 12_000), "38:12")
  assert.equal(formatBarCountdown(9_000), "00:09")
  assert.equal(formatBarCountdown(0), "00:00")
  assert.equal(formatBarCountdown(-1), "00:00")
  assert.equal(formatBarCountdown(60 * 60_000), "01.00")
  assert.equal(formatBarCountdown(2 * 3_600_000 + 5 * 60_000), "02.05")
  assert.equal(formatBarCountdown(23 * 3_600_000 + 59 * 60_000), "23.59")
  assert.equal(formatBarCountdown(24 * 3_600_000), "1 hari")
  assert.equal(formatBarCountdown(2 * 86_400_000 + 3 * 3_600_000), "2 hari 3 jam")
  assert.equal(formatBarCountdown(25 * 3_600_000), "1 hari 1 jam")
})

test("time left rounds up to minutes, then hours, then days", () => {
  assert.equal(formatTimeLeft(38 * 60_000 - 5_000), "38 menit lagi")
  assert.equal(formatTimeLeft(1_000), "1 menit lagi")
  assert.equal(formatTimeLeft(2 * 3_600_000 + 10 * 60_000), "2 jam lagi")
  assert.equal(formatTimeLeft(39 * 3_600_000), "1 hari 15 jam lagi")
  assert.equal(formatTimeLeft(3 * 86_400_000 + 5 * 3_600_000), "3 hari 5 jam lagi")
  assert.equal(formatTimeLeft(2 * 86_400_000), "2 hari lagi")
  assert.equal(formatTimeLeft(24 * 3_600_000), "1 hari lagi")
  assert.equal(formatTimeLeft(0), "Waktu habis")
})

test("a live lot turns to the ending-soon chip under an hour", () => {
  assert.equal(lotStatusChip("live", null).label, "Live")
  assert.equal(lotStatusChip("live", 2 * 3_600_000).label, "Live")
  assert.deepEqual(lotStatusChip("live", 59 * 60_000), {
    label: "Berakhir < 1 jam",
    tone: "warning",
    icon: "clock",
  })
  assert.equal(lotStatusChip("live", 0).label, "Live")
})

test("the other statuses are neutral chips with their own icon", () => {
  assert.equal(lotStatusChip("upcoming", null).label, "Akan datang")
  assert.equal(lotStatusChip("ended", null).label, "Selesai")
  assert.equal(lotStatusChip("cancelled", null).label, "Dibatalkan")
  for (const s of ["upcoming", "ended", "cancelled"] as const) {
    assert.equal(lotStatusChip(s, null).tone, "neutral")
  }
})

test("the join note shows only to a signed-in viewer on an open unjoined lot", () => {
  const fmt = (n: number) => `Rp ${n}`
  assert.equal(
    lotJoinNote({ signedIn: true, joined: false, status: "live", joinFee: 100_000 }, fmt),
    "Belum ikut · biaya ikut Rp 100000"
  )
  assert.equal(
    lotJoinNote({ signedIn: true, joined: false, status: "upcoming", joinFee: 0 }, fmt),
    "Belum ikut · biaya ikut Rp 0"
  )
  // Guests get joined=false from the API, but never see the note.
  assert.equal(
    lotJoinNote({ signedIn: false, joined: false, status: "live", joinFee: 100_000 }, fmt),
    undefined
  )
  // A joined lot, or one with an unknown join state, shows nothing.
  assert.equal(
    lotJoinNote({ signedIn: true, joined: true, status: "live", joinFee: 100_000 }, fmt),
    undefined
  )
  assert.equal(
    lotJoinNote({ signedIn: true, status: "live", joinFee: 100_000 }, fmt),
    undefined
  )
})

test("a closed or cancelled lot never shows the join note", () => {
  const fmt = (n: number) => `Rp ${n}`
  for (const status of ["ended", "cancelled"] as const) {
    assert.equal(
      lotJoinNote({ signedIn: true, joined: false, status, joinFee: 100_000 }, fmt),
      undefined
    )
  }
})

test("a missing fee keeps the note short instead of printing Rp NaN", () => {
  assert.equal(
    lotJoinNote({ signedIn: true, joined: false, status: "live" }, (n) => `Rp ${n}`),
    "Belum ikut"
  )
})

test("viewer position chips", () => {
  const fmt = (n: number) => `Rp ${n}`
  assert.deepEqual(viewerPositionChip({ kind: "highest" }, fmt), {
    label: "Anda tertinggi",
    tone: "success",
    icon: "highest",
  })
  assert.equal(
    viewerPositionChip({ kind: "outbid", amount: 2_400_000 }, fmt).label,
    "Bid Anda tersalip · Rp 2400000"
  )
})

test("a closed lot card reads Terjual or Tidak terjual, never while open", () => {
  assert.equal(lotClosedLabel({ sold: true }), "Terjual")
  assert.equal(lotClosedLabel({ sold: false }), "Tidak terjual")
  assert.equal(lotClosedLabel({}), null)
})

test("a cancelled lot card never reads a sold label", () => {
  assert.equal(lotClosedLabel({ cancelled: true, sold: true }), null)
  assert.equal(lotClosedLabel({ cancelled: true, sold: false }), null)
})

test("price line: opening bid, running bid, final, unsold, cancelled", () => {
  const base = { currentBid: 1_500_000, openingBid: 1_000_000 }
  assert.deepEqual(lotPriceLine({ ...base, bidCount: 0, currentBid: 0 }), {
    label: "Harga awal (OB)",
    amount: 1_000_000,
  })
  assert.deepEqual(lotPriceLine({ ...base, bidCount: 3 }), {
    label: "Bid tertinggi · 3 bid",
    amount: 1_500_000,
  })
  assert.deepEqual(lotPriceLine({ ...base, bidCount: 3, sold: true }), {
    label: "Harga akhir",
    amount: 1_500_000,
  })
  assert.equal(lotPriceLine({ ...base, bidCount: 0, sold: false }), null)
  assert.equal(lotPriceLine({ ...base, cancelled: true }), null)
})

test("lost result label carries the final price's bid count (US-100 AC2)", () => {
  assert.equal(closedPriceLabel(7), "Harga akhir · 7 bid")
  assert.equal(closedPriceLabel(1), "Harga akhir · 1 bid")
  assert.equal(closedPriceLabel(0), "Harga akhir · Belum ada bid")
})
