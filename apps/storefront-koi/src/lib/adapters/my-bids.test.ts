import assert from "node:assert/strict"
import { test } from "node:test"

import { toPositionMap } from "./my-bids.ts"

test("highest and outbid map to the card position, outbid with the viewer's own top bid", () => {
  const map = toPositionMap([
    { lot_id: "lot_1", position: "highest", my_highest_bid: 2_000_000 },
    { lot_id: "lot_2", position: "outbid", my_highest_bid: 2_400_000 },
  ])
  assert.deepEqual(map.get("lot_1"), { kind: "highest" })
  assert.deepEqual(map.get("lot_2"), { kind: "outbid", amount: 2_400_000 })
})

test("won, lost and cancelled give no position, and an unmatched lot has none", () => {
  const map = toPositionMap([
    { lot_id: "lot_3", position: "won", my_highest_bid: 1 },
    { lot_id: "lot_4", position: "lost", my_highest_bid: 1 },
    { lot_id: "lot_5", position: "cancelled", my_highest_bid: 1 },
  ])
  assert.equal(map.size, 0)
  assert.equal(map.get("lot_9"), undefined)
})

test("no bids, no positions", () => {
  assert.equal(toPositionMap([]).size, 0)
})
