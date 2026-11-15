import { maskAccountNumber, maskName, maskNik, maskPhone } from "../mask"

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
})
