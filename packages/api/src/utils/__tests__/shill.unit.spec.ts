import { isShillShare, isShillUnpaid } from "../shill"

// US-071 (AC2): both thresholds are inclusive and pinned: >=50% and >=2.
describe("shill flags", () => {
  it("flags share at exactly 50% and not one bid below", () => {
    expect(isShillShare(5, 10)).toBe(true)
    expect(isShillShare(6, 11)).toBe(true)
    expect(isShillShare(5, 11)).toBe(false)
    expect(isShillShare(1, 2)).toBe(true)
  })

  it("never flags an empty ratio", () => {
    expect(isShillShare(0, 0)).toBe(false)
    expect(isShillShare(0, 5)).toBe(false)
  })

  it("flags unpaid wins at exactly 2", () => {
    expect(isShillUnpaid(1)).toBe(false)
    expect(isShillUnpaid(2)).toBe(true)
    expect(isShillUnpaid(3)).toBe(true)
  })
})
