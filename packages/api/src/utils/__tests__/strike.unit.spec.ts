import { isActiveStrike, isBanned, STRIKE_WINDOW_DAYS } from "../strike"

const now = new Date("2026-11-18T12:00:00.000Z")
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

describe("strike window and derived ban (US-059)", () => {
  it("counts a strike inside the window", () => {
    expect(STRIKE_WINDOW_DAYS).toEqual(180)
    expect(
      isActiveStrike({ removed_at: null, created_at: daysAgo(179) }, now)
    ).toBe(true)
  })

  it("exactly 180 days old is expired", () => {
    expect(
      isActiveStrike({ removed_at: null, created_at: daysAgo(180) }, now)
    ).toBe(false)
    expect(
      isActiveStrike({ removed_at: null, created_at: daysAgo(181) }, now)
    ).toBe(false)
  })

  it("a removed strike is inactive whatever its age", () => {
    expect(
      isActiveStrike({ removed_at: daysAgo(1), created_at: daysAgo(10) }, now)
    ).toBe(false)
  })

  it("accepts ISO strings from query.graph", () => {
    expect(
      isActiveStrike(
        { removed_at: null, created_at: daysAgo(30).toISOString() },
        now
      )
    ).toBe(true)
  })

  it("2 active strikes = ban, 1 = not", () => {
    expect(isBanned(0)).toBe(false)
    expect(isBanned(1)).toBe(false)
    expect(isBanned(2)).toBe(true)
    expect(isBanned(3)).toBe(true)
  })
})
