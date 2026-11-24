import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  bidTabLabel,
  groupMyBids,
  parseBidTab,
  wonSteps,
} from "./my-bids.ts"
import type { StoreMyBid } from "../data/lots.ts"

type BidFixture = Pick<StoreMyBid, "lot_id" | "position" | "my_highest_bid"> & {
  lot: { end_time: string }
}

const bid = (
  overrides: Pick<BidFixture, "lot_id" | "position"> &
    Partial<Pick<BidFixture, "my_highest_bid" | "lot">>
): BidFixture => ({
  my_highest_bid: 1_000_000,
  lot: { end_time: "2026-11-24T13:00:00.000Z" },
  ...overrides,
})

describe("parseBidTab", () => {
  it("defaults to aktif", () => {
    assert.equal(parseBidTab(undefined), "aktif")
    assert.equal(parseBidTab("nope"), "aktif")
  })

  it("reads the three tabs", () => {
    assert.equal(parseBidTab("menang"), "menang")
    assert.equal(parseBidTab(["kalah"]), "kalah")
  })
})

describe("bidTabLabel", () => {
  it("adds counts to Aktif and Menang only", () => {
    assert.equal(bidTabLabel("aktif", 2), "Aktif · 2")
    assert.equal(bidTabLabel("menang", 0), "Menang · 0")
    assert.equal(bidTabLabel("kalah", 3), "Kalah")
    assert.equal(bidTabLabel("aktif"), "Aktif")
  })
})

describe("groupMyBids", () => {
  const bids = [
    bid({
      lot_id: "late",
      position: "highest",
      lot: { end_time: "2026-11-26T13:00:00.000Z" },
    }),
    bid({
      lot_id: "soon",
      position: "outbid",
      lot: { end_time: "2026-11-24T13:00:00.000Z" },
    }),
    bid({ lot_id: "won", position: "won" }),
    bid({ lot_id: "lost", position: "lost" }),
    bid({ lot_id: "gone", position: "cancelled" }),
  ]

  it("buckets the positions and drops cancelled lots", () => {
    const result = groupMyBids(bids)

    assert.deepEqual(
      result.active.map((row) => row.lot_id),
      ["soon", "late"]
    )
    assert.deepEqual(
      result.won.map((row) => row.lot_id),
      ["won"]
    )
    assert.deepEqual(
      result.lost.map((row) => row.lot_id),
      ["lost"]
    )
  })

  it("counts only Aktif and Menang", () => {
    assert.deepEqual(groupMyBids(bids).counts, { aktif: 2, menang: 1 })
    assert.deepEqual(groupMyBids([]).counts, { aktif: 0, menang: 0 })
  })
})

describe("wonSteps", () => {
  const states = (status?: string | null) => wonSteps(status).map((step) => step.state)

  it("marks the reached step current", () => {
    assert.deepEqual(states("won"), ["current", "todo", "todo", "todo"])
    assert.deepEqual(states("paid"), ["done", "current", "todo", "todo"])
    assert.deepEqual(states("shipped"), ["done", "done", "current", "todo"])
    assert.deepEqual(states("delivered"), ["done", "done", "done", "current"])
  })

  it("treats claimed as delivered and unknown as won", () => {
    assert.deepEqual(states("claimed"), states("delivered"))
    assert.deepEqual(states(null), states("won"))
  })

  it("always uses the four story labels", () => {
    assert.deepEqual(
      wonSteps("paid").map((step) => step.label),
      ["Menang", "Dibayar", "Dikirim", "Diterima"]
    )
  })
})
