import {
  maskAccountNumber,
  maskBidder,
  maskName,
  maskNik,
  maskPhone,
} from "../mask"

describe("PII masks (US-092 T-092.2)", () => {
  it("NIK keeps the first 4 and last 2", () => {
    expect(maskNik("3273012345678901")).toEqual("3273**********01")
    expect(maskNik("123456")).toEqual("******")
  })

  it("account number keeps the last 4", () => {
    expect(maskAccountNumber("1234567890")).toEqual("******7890")
    expect(maskAccountNumber("1234")).toEqual("****")
  })

  it("name keeps the first letter of each word", () => {
    expect(maskName("Budi  Santoso")).toEqual("B*** S******")
    expect(maskName("A")).toEqual("*")
  })

  it("phone keeps +62 and the last 3", () => {
    expect(maskPhone("+6281234567890")).toEqual("+62********890")
    expect(maskPhone("081234567890")).toEqual("*********890")
    expect(maskPhone("+62")).toEqual("+62")
  })

  it("null and blank stay null", () => {
    for (const mask of [maskNik, maskAccountNumber, maskName, maskPhone]) {
      expect(mask(null)).toBeNull()
      expect(mask(undefined)).toBeNull()
      expect(mask("  ")).toBeNull()
    }
  })

  // US-044 (D-051).
  it("bidder keeps 3 letters of the first name and the last 2 of the id", () => {
    expect(maskBidder("Budi", "cus_123456789S09X")).toEqual("Bud***9x")
    expect(maskBidder("Al", "cus_123456789S09X")).toEqual("Al***9x")
    expect(maskBidder(null, "cus_123456789S09X")).toEqual("***9x")
    expect(maskBidder("   ", "cus_123456789S09X")).toEqual("***9x")
    expect(maskBidder("  Budi  ", "cus_123456789S09X")).toEqual("Bud***9x")
  })

  it("bidder masks two customers who share a first name differently", () => {
    expect(maskBidder("Budi", "cus_sameA")).not.toEqual(
      maskBidder("Budi", "cus_sameB")
    )
  })
})
