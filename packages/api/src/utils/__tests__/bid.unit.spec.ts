import { bidTooLowMessage } from "../bid"

describe("bidTooLowMessage (US-042 AC3)", () => {
  it("names only the minimum when no bid exists yet", () => {
    expect(
      bidTooLowMessage({ minimum: 1_000_000, current_price: 1_000_000, has_bid: false })
    ).toEqual("Bid minimal Rp1.000.000.")
  })

  it("adds the current price once a bid exists", () => {
    expect(
      bidTooLowMessage({ minimum: 1_100_000, current_price: 1_000_000, has_bid: true })
    ).toEqual("Bid minimal Rp1.100.000. Harga sekarang Rp1.000.000.")
  })

  it("groups a large amount id-ID", () => {
    expect(
      bidTooLowMessage({ minimum: 25_000_000, current_price: 24_000_000, has_bid: true })
    ).toEqual("Bid minimal Rp25.000.000. Harga sekarang Rp24.000.000.")
  })

  it("formats zero as Rp0", () => {
    expect(
      bidTooLowMessage({ minimum: 0, current_price: 0, has_bid: false })
    ).toEqual("Bid minimal Rp0.")
  })
})
