import {
  decryptPii,
  decryptPiiFields,
  encryptPii,
  isPiiEncrypted,
} from "../pii-crypto"

// US-092 T-092.1 (D-043). The envelope and the rules T-092.6's migration and
// the write/read middleware both rely on.
const TEST_KEY = Buffer.from(
  "0123456789abcdef0123456789abcdef",
  "utf8"
).toString("base64")

const withKey = (value: string | undefined, fn: () => void) => {
  const previous = process.env.PII_ENCRYPTION_KEY
  if (value === undefined) delete process.env.PII_ENCRYPTION_KEY
  else process.env.PII_ENCRYPTION_KEY = value
  // The key is cached per process once read; a fresh module reads it again.
  jest.resetModules()
  try {
    fn()
  } finally {
    if (previous === undefined) delete process.env.PII_ENCRYPTION_KEY
    else process.env.PII_ENCRYPTION_KEY = previous
    jest.resetModules()
  }
}

describe("PII crypto (D-043)", () => {
  const NIK = "3273012345678901"

  beforeEach(() => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY
  })

  it("round-trips a value", () => {
    const ciphertext = encryptPii(NIK)
    expect(ciphertext).not.toEqual(NIK)
    expect(decryptPii(ciphertext)).toEqual(NIK)
  })

  it("produces ciphertext that does not contain the plaintext", () => {
    const ciphertext = encryptPii("+6281234567890") as string
    expect(ciphertext).toMatch(/^enc:v1:[0-9a-f]{8}:/)
    expect(ciphertext).not.toContain("6281234567890")
    expect(isPiiEncrypted(ciphertext)).toBe(true)
  })

  it("uses a fresh IV, so the same value encrypts differently each time", () => {
    expect(encryptPii(NIK)).not.toEqual(encryptPii(NIK))
  })

  it("does not double-encrypt an already-encrypted value", () => {
    const once = encryptPii(NIK) as string
    expect(encryptPii(once)).toEqual(once)
    expect(decryptPii(encryptPii(once))).toEqual(NIK)
  })

  it("keeps null and blank as null", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(encryptPii(value)).toBeNull()
      expect(decryptPii(value)).toBeNull()
    }
  })

  it("passes pre-migration plaintext through decrypt unchanged", () => {
    expect(decryptPii(NIK)).toEqual(NIK)
  })

  it("decrypts PII fields in a nested response, leaving other fields alone", () => {
    const body = {
      id: "sel_1",
      phone: encryptPii("+6281111222333"),
      payment_details: {
        holder_name: encryptPii("Budi Santoso"),
        account_number: encryptPii("1234567890"),
        bank_name: "BCA",
      },
      name: "Kebun Kita",
    }
    expect(decryptPiiFields(body)).toEqual({
      id: "sel_1",
      phone: "+6281111222333",
      payment_details: {
        holder_name: "Budi Santoso",
        account_number: "1234567890",
        bank_name: "BCA",
      },
      name: "Kebun Kita",
    })
  })

  it("fails loudly when the key does not match the ciphertext", () => {
    const ciphertext = encryptPii(NIK) as string
    const wrong = Buffer.from("ffffffffffffffffffffffffffffffff", "utf8").toString(
      "base64"
    )
    withKey(wrong, () => {
      const fresh = require("../pii-crypto") as typeof import("../pii-crypto")
      expect(() => fresh.decryptPii(ciphertext)).toThrow(/PII_ENCRYPTION_KEY/)
    })
  })

  it("fails loudly when no key is configured", () => {
    withKey(undefined, () => {
      const fresh = require("../pii-crypto") as typeof import("../pii-crypto")
      expect(() => fresh.encryptPii(NIK)).toThrow(/PII_ENCRYPTION_KEY is not set/)
    })
  })
})
