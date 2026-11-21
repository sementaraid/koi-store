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

// US-092 T-092.9 (AC7). `/admin/sellers*` returns Mercur's
// `payout_account.data` free-form JSON; `professional_details` must stay full.
describe("payout_account.data mask (US-092 T-092.9)", () => {
  const PAYOUT_ACCOUNT = {
    id: "pacc_1",
    status: "active",
    data: {
      bank_name: "BCA",
      bank_account: "1234567890",
      phone: "+6281234567890",
      branch: "Kemang",
      nested: { account_number: "9876543210", notes: "primary account" },
      list: ["081234567890", "no digits here", 1234567],
    },
    onboarding: { id: "onb_1", data: { reference: "ref-42" } },
  }

  const PROFESSIONAL_DETAILS = {
    corporate_name: "PT Koi Nusantara",
    registration_number: "9120001234567",
    tax_id: "01.234.567.8-901.000",
  }

  it("masks PII-looking values in payout_account.data, keeps the rest, leaves professional_details full", () => {
    const masked = run(adminPiiMask as unknown as Handler, "/sellers/sel_1", {
      sellers: [
        {
          id: "sel_1",
          payout_account: PAYOUT_ACCOUNT,
          professional_details: PROFESSIONAL_DETAILS,
        },
      ],
    }) as { sellers: { payout_account: typeof PAYOUT_ACCOUNT; professional_details: unknown }[] }

    expect(masked.sellers[0]!.payout_account.data).toEqual({
      bank_name: "BCA",
      bank_account: "******7890",
      phone: "+62********890",
      branch: "Kemang",
      nested: { account_number: "******3210", notes: "primary account" },
      list: ["*********890", "no digits here", "***4567"],
    })
    expect(masked.sellers[0]!.payout_account.onboarding).toEqual(PAYOUT_ACCOUNT.onboarding)
    expect(masked.sellers[0]!.professional_details).toEqual(PROFESSIONAL_DETAILS)
  })

  it("is idempotent and leaves an untouched seller body by reference", () => {
    const masked = run(adminPiiMask as unknown as Handler, "/sellers/sel_1", {
      seller: { id: "sel_1", payout_account: PAYOUT_ACCOUNT },
    }) as { seller: { payout_account: typeof PAYOUT_ACCOUNT } }

    expect(
      run(adminPiiMask as unknown as Handler, "/sellers/sel_1", masked)
    ).toEqual(masked)

    const plain = { sellers: [{ id: "sel_1", payout_account: { data: { bank_name: "BCA" } } }] }
    expect(run(adminPiiMask as unknown as Handler, "/sellers", plain)).toBe(plain)
  })
})
