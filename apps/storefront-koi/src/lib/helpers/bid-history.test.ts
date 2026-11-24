import assert from "node:assert/strict"
import { test } from "node:test"

import { isOwnBid } from "./bid-history.ts"

const own = [
  { amount: 2_400_000, created_at: "2026-11-19T10:00:00.000Z" },
  { amount: 2_200_000, created_at: "2026-11-19T09:00:00.000Z" }
]

test("a bid matches the viewer's own bid on amount and exact time", () => {
  assert.equal(
    isOwnBid({ amount: 2_400_000, at: "2026-11-19T10:00:00.000Z" }, own),
    true
  )
  assert.equal(
    isOwnBid({ amount: 2_200_000, at: "2026-11-19T09:00:00.000Z" }, own),
    true
  )
})

test("the same amount at a different time is someone else's", () => {
  assert.equal(
    isOwnBid({ amount: 2_400_000, at: "2026-11-19T10:00:01.000Z" }, own),
    false
  )
})

test("the same time with a different amount is someone else's", () => {
  assert.equal(
    isOwnBid({ amount: 2_450_000, at: "2026-11-19T10:00:00.000Z" }, own),
    false
  )
})

test("a guest (no own bids) never matches", () => {
  assert.equal(
    isOwnBid({ amount: 2_400_000, at: "2026-11-19T10:00:00.000Z" }, undefined),
    false
  )
  assert.equal(
    isOwnBid({ amount: 2_400_000, at: "2026-11-19T10:00:00.000Z" }, []),
    false
  )
})
