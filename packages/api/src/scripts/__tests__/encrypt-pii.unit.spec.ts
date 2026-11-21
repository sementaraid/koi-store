import { decryptPii, encryptPii, isPiiEncrypted } from "../../utils/pii-crypto"
import { encryptColumns } from "../encrypt-pii"

// US-092 T-092.6. The row-level transform the migration applies, exercised
// without a database.

const PHONE_COLUMNS = ["phone"] as const

describe("encryptColumns", () => {
  it("encrypts a plaintext value and leaves a readable original behind the envelope", () => {
    const patch = encryptColumns({ id: "cus_1", phone: "+6281111222333" }, PHONE_COLUMNS)

    expect(Object.keys(patch)).toEqual(["phone"])
    expect(isPiiEncrypted(patch.phone)).toBe(true)
    expect(decryptPii(patch.phone)).toBe("+6281111222333")
  })

  it("skips a value that already carries the envelope", () => {
    const stored = encryptPii("+6281111222333") as string
    const patch = encryptColumns({ id: "cus_1", phone: stored }, PHONE_COLUMNS)

    expect(patch).toEqual({})
  })

  it("leaves blank values blank and does not write null", () => {
    expect(encryptColumns({ id: "a", phone: "" }, PHONE_COLUMNS)).toEqual({})
    expect(encryptColumns({ id: "b", phone: "   " }, PHONE_COLUMNS)).toEqual({})
    expect(encryptColumns({ id: "c", phone: null }, PHONE_COLUMNS)).toEqual({})
  })

  it("is a no-op on a second pass over the encrypted row", () => {
    const row = { id: "pd_1", holder_name: "Budi", account_number: "1234567890" }
    const columns = ["holder_name", "account_number"] as const

    const first = encryptColumns(row, columns)
    const second = encryptColumns({ ...row, ...first }, columns)

    expect(Object.keys(first).sort()).toEqual(["account_number", "holder_name"])
    expect(second).toEqual({})
  })

  it("touches only the columns in scope", () => {
    const patch = encryptColumns(
      { id: "pd_1", holder_name: "Budi", bank_name: "BCA", bic: "CENAIDJA" },
      ["holder_name", "account_number", "iban", "routing_number"]
    )

    expect(Object.keys(patch)).toEqual(["holder_name"])
  })
})
