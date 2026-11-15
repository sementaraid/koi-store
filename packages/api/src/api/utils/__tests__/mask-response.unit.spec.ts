import {
  adminPiiMask,
  storePiiMask,
  vendorPiiMask,
} from "../mask-response"

// US-092 T-092.2. Exercises the res.json wrapper directly: same contract as an
// Express handler calling `res.json(body)`.

type Handler = (req: unknown, res: unknown, next: () => void) => void

const run = (middleware: Handler, path: string, body: unknown) => {
  let sent: unknown
  const res = {
    json: (value: unknown) => {
      sent = value
    },
  }
  const req = { path }
  middleware(req, res, () => {})
  // Express copies the override onto the response; here the wrapper replaced it.
  ;(res.json as (value: unknown) => void)(body)
  return sent
}

const SELLER = {
  id: "sel_1",
  phone: "+6281111222333",
  payment_details: {
    holder_name: "Budi Santoso",
    bank_name: "BCA",
    account_number: "1234567890",
  },
  custom_fields: { ktp_nik: "3273012345678901" },
}

describe("PII response masks (US-092 T-092.2)", () => {
  it("masks a seller's phone, bank details and NIK on /admin", () => {
    const masked = run(adminPiiMask as unknown as Handler, "/sellers/sel_1", {
      seller: SELLER,
    }) as { seller: typeof SELLER }

    expect(masked.seller).toMatchObject({
      phone: "+62********333",
      payment_details: {
        holder_name: "B*** S******",
        bank_name: "BCA",
        account_number: "******7890",
      },
      custom_fields: { ktp_nik: "3273**********01" },
    })
  })

  it("keeps the logged farm reveal unmasked on /admin", () => {
    const body = { field: "phone", value: "+6281111222333" }
    expect(run(adminPiiMask as unknown as Handler, "/farms/sel_1/reveal", body)).toEqual(body)
  })

  it("keeps the caller's own seller record full on /vendor/sellers", () => {
    expect(run(vendorPiiMask as unknown as Handler, "/sellers/me", { seller: SELLER }))
      .toEqual({ seller: SELLER })
  })

  it("masks a customer's phone for a farmer on /vendor/customers", () => {
    const masked = run(vendorPiiMask as unknown as Handler, "/customers", {
      customers: [{ id: "cus_1", phone: "+6281234567890", addresses: [{ phone: "+6281234567890" }] }],
    }) as { customers: { phone: string; addresses: { phone: string }[] }[] }

    expect(masked.customers[0]!.phone).toEqual("+62********890")
    expect(masked.customers[0]!.addresses[0]!.phone).toEqual("+62********890")
  })

  it("masks a public seller but keeps the caller's own customer phone on /store", () => {
    const masked = run(storePiiMask as unknown as Handler, "/products", {
      products: [{ id: "prod_1", seller: SELLER }],
    }) as { products: { seller: typeof SELLER }[] }
    expect(masked.products[0]!.seller.phone).toEqual("+62********333")

    const own = { customer: { id: "cus_1", phone: "+6281234567890" } }
    expect(run(storePiiMask as unknown as Handler, "/customers/me", own)).toEqual(own)
  })

  it("does not mask twice, and leaves values without PII untouched", () => {
    const already = { seller: { phone: "+62********333", payment_details: null } }
    expect(run(adminPiiMask as unknown as Handler, "/sellers/sel_1", already)).toEqual(already)

    const plain = { products: [{ id: "prod_1", title: "Kohaku" }] }
    expect(run(storePiiMask as unknown as Handler, "/products", plain)).toEqual(plain)
  })
})
