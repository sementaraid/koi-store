import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  createSellerAccountWorkflow,
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { AuctionStatus } from "../../src/modules/auction/models/auction"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { PII_AUDIT_MODULE } from "../../src/modules/pii-audit"
import type PiiAuditModuleService from "../../src/modules/pii-audit/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { createStep, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { setLotFieldsStep } from "../../src/workflows/steps/lot"

jest.setTimeout(120 * 1000)

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

// US-051 T-051.1b/T-051.5 (AC2, AC4, AC5, D-052, D-054, D-056): the farmer's
// sold lots, the winner's masked address and the logged full-address reveal.

const DAY = 24 * 60 * 60 * 1000

// US-052 T-052.1: the real mutation, then a failure, so its compensation runs.
const failAfterLotFieldsStep = createStep("qa-fail-after-lot-fields", async () => {
  throw new Error("qa: simulated failure after setLotFieldsStep")
})
const setLotFieldsThenFailWorkflow = createWorkflow(
  "set-lot-fields-then-fail-test",
  function (input: { id: string; update: { status: "shipped" } }) {
    setLotFieldsStep(input)
    failAfterLotFieldsStep()
  }
)

const STREET = "Jl. Raya Bogor 1"
const POSTAL = "16111"
const CITY = "Bogor"
const PROVINCE = "Jawa Barat"
const WINNER_PHONE = "+6281111222333"
const ADDRESS_PHONE = "+6289999000111"

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    // A farmer as US-020 leaves one: customer + member on one identity, seller.
    const registerFarm = async () => {
      const container = getContainer()
      const email = `sold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso" }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: customer.id },
      })

      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          payment_details: {
            holder_name: "Budi Santoso",
            bank_name: "BCA",
            account_number: "1234567890",
          },
        },
      })

      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const vendor = {
        authorization: `Bearer ${signIn.data.token}`,
        "x-seller-id": seller.id,
      }
      const customerHeaders = await api
        .post("/auth/customer/emailpass", { email, password })
        .then((r) => ({ authorization: `Bearer ${r.data.token}` }))
      return { seller, customer, vendor, customerHeaders }
    }

    // A winner with some addresses. Only `is_default_shipping` is returned
    // masked; phone/company are set here so a leak would show.
    const winner = async (
      addresses: {
        is_default_shipping?: boolean
        address_1?: string
        city?: string
        province?: string
        postal_code?: string
        phone?: string
        company?: string
      }[]
    ) => {
      const [row] = await getContainer()
        .resolve(Modules.CUSTOMER)
        .createCustomers([
          {
            email: `winner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
            first_name: "Siti",
            last_name: "Rahmawati",
            phone: WINNER_PHONE,
            addresses: addresses.map((a) => ({
              first_name: "Siti",
              last_name: "Rahmawati",
              address_1: a.address_1 ?? STREET,
              address_2: "RT 01",
              city: a.city ?? CITY,
              province: a.province ?? PROVINCE,
              postal_code: a.postal_code ?? POSTAL,
              country_code: "id",
              phone: a.phone ?? ADDRESS_PHONE,
              company: a.company ?? "PT Rahasia",
              is_default_shipping: a.is_default_shipping ?? false,
              is_default_billing: false,
            })),
          },
        ])
      return row
    }

    const product = async (suffix: string) => {
      const [row] = await getContainer()
        .resolve(Modules.PRODUCT)
        .createProducts([
          {
            title: `Kohaku ${suffix}`,
            description: "Maruten bersih.",
            status: "draft" as never,
            thumbnail: `http://localhost:9000/static/${suffix}.jpg`,
            images: [{ url: `http://localhost:9000/static/${suffix}.jpg` }],
          },
        ])
      return row
    }

    const auction = async (
      sellerId: string,
      status: AuctionStatus = "closed",
      deliveryMethod: "courier" | "self_delivery" = "courier"
    ) => {
      const start = Date.now() - 2 * DAY
      const [row] = await auctions().createAuctions([
        {
          seller_id: sellerId,
          fee_category_id: "feecat_sold",
          start_at: new Date(start),
          end_at: new Date(start + DAY),
          delivery_method: deliveryMethod,
          status,
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      return row.id
    }

    const lot = async (options: {
      auctionId: string
      productId: string
      status: LotStatus
      winnerCustomerId?: string | null
    }) => {
      const [row] = await auctions().createLots([
        {
          auction_id: options.auctionId,
          product_id: options.productId,
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_000_000,
          end_time: new Date(Date.now() - 60_000),
          status: options.status,
          winner_customer_id: options.winnerCustomerId ?? null,
          final_price: options.winnerCustomerId ? 1_500_000 : null,
          closed_at: options.winnerCustomerId ? new Date() : null,
        },
      ])
      return row.id
    }

    const auditRows = (recordId: string) =>
      getContainer()
        .resolve<PiiAuditModuleService>(PII_AUDIT_MODULE)
        .listPiiRevealAudits({ record_id: recordId })

    const p = (suffix: string) => product(suffix)

    describe("sold lots list", () => {
      it("lists only won+ lots of the caller's seller, with the masked address (AC2)", async () => {
        const { seller, vendor } = await registerFarm()
        const winnerCustomer = await winner([
          { is_default_shipping: true, city: "Bogor", province: "Jawa Barat" },
        ])
        const a = await auction(seller.id)
        const prod = await p("a")
        const won = await lot({
          auctionId: a,
          productId: prod.id,
          status: "won",
          winnerCustomerId: winnerCustomer.id,
        })
        // Not sold: open, unsold and cancelled are absent.
        await lot({ auctionId: a, productId: prod.id, status: "open" })
        await lot({ auctionId: a, productId: prod.id, status: "unsold" })
        await lot({ auctionId: a, productId: prod.id, status: "cancelled" })

        const res = await api.get("/vendor/sold-lots", { headers: vendor })
        expect(res.status).toEqual(200)
        expect(res.data.count).toEqual(1)
        const [row] = res.data.lots
        expect(row).toMatchObject({
          id: won,
          status: "won",
          final_price: 1_500_000,
          winner: {
            name: "Siti Rahmawati",
            address: { city: CITY, province: PROVINCE },
          },
          product: { title: "Kohaku a" },
          auction: { id: a, delivery_method: "courier" },
        })

        // D-052 / D-056: no phone, email, customer id, street or postal code —
        // keys or values.
        const body = JSON.stringify(res.data)
        for (const secret of [
          WINNER_PHONE,
          ADDRESS_PHONE,
          winnerCustomer.id,
          winnerCustomer.email,
          STREET,
          POSTAL,
          "RT 01",
          "PT Rahasia",
        ]) {
          expect(body).not.toContain(secret)
        }
        for (const key of ["phone", "email", "winner_customer_id", "address_1", "postal_code"]) {
          expect(row).not.toHaveProperty(key)
          expect(row.winner).not.toHaveProperty(key)
          if (row.winner.address) expect(row.winner.address).not.toHaveProperty(key)
        }
      })

      it("gives address null for a non-default address or none (AC2, D-056)", async () => {
        const { seller, vendor } = await registerFarm()
        const onlyNonDefault = await winner([{ is_default_shipping: false }])
        const none = await winner([])
        const a = await auction(seller.id)
        const prod = await p("b")
        const nonDefaultLot = await lot({
          auctionId: a,
          productId: prod.id,
          status: "won",
          winnerCustomerId: onlyNonDefault.id,
        })
        const noAddressLot = await lot({
          auctionId: a,
          productId: prod.id,
          status: "won",
          winnerCustomerId: none.id,
        })

        const res = await api.get("/vendor/sold-lots", { headers: vendor })
        const byId = new Map(
          res.data.lots.map((l: { id: string; winner: { address: unknown } }) => [
            l.id,
            l,
          ])
        )
        expect((byId.get(nonDefaultLot) as { winner: { address: unknown } }).winner.address).toBeNull()
        expect((byId.get(noAddressLot) as { winner: { address: unknown } }).winner.address).toBeNull()
        // The name is still there.
        expect(
          (byId.get(noAddressLot) as { winner: { name: string } }).winner.name
        ).toEqual("Siti Rahmawati")
      })

      it("never lists another seller's lots (AC2)", async () => {
        const farmerA = await registerFarm()
        const farmerB = await registerFarm()
        const winnerCustomer = await winner([{ is_default_shipping: true }])
        const prod = await p("c")
        const aA = await auction(farmerA.seller.id)
        const aB = await auction(farmerB.seller.id)
        const lotA = await lot({
          auctionId: aA,
          productId: prod.id,
          status: "won",
          winnerCustomerId: winnerCustomer.id,
        })
        const lotB = await lot({
          auctionId: aB,
          productId: prod.id,
          status: "won",
          winnerCustomerId: winnerCustomer.id,
        })

        const res = await api.get("/vendor/sold-lots", { headers: farmerA.vendor })
        expect(res.data.lots.map((l: { id: string }) => l.id)).toEqual([lotA])
        expect(JSON.stringify(res.data)).not.toContain(lotB)
      })

      it("refuses a terminated farm with 403 but allows a suspended one (D-054)", async () => {
        const container = getContainer()
        const { seller, vendor } = await registerFarm()
        const a = await auction(seller.id)
        const prod = await p("d")
        await lot({ auctionId: a, productId: prod.id, status: "won", winnerCustomerId: (await winner([])).id })

        await suspendSellerWorkflow(container).run({
          input: { seller_id: seller.id, reason: "qa suspend" },
        })
        expect(await statusOf(api.get("/vendor/sold-lots", { headers: vendor }))).toEqual(200)

        await terminateSellerWorkflow(container).run({
          input: { seller_id: seller.id, reason: "qa terminate" },
        })
        expect(await statusOf(api.get("/vendor/sold-lots", { headers: vendor }))).toEqual(403)
      })

      it("refuses a customer token and a missing x-seller-id", async () => {
        const { vendor, customerHeaders } = await registerFarm()
        expect(
          await statusOf(api.get("/vendor/sold-lots", { headers: customerHeaders }))
        ).toEqual(401)
        expect(
          await statusOf(
            api.get("/vendor/sold-lots", {
              headers: { authorization: vendor.authorization },
            })
          )
        ).toEqual(400)
      })
    })

    describe("address reveal", () => {
      const seedSold = async (options: {
        addresses: Parameters<typeof winner>[0]
        status?: LotStatus
      }) => {
        const farmer = await registerFarm()
        const winnerCustomer = await winner(options.addresses)
        const a = await auction(farmer.seller.id)
        const prod = await p(`r${Math.random().toString(36).slice(2, 6)}`)
        const lotId = await lot({
          auctionId: a,
          productId: prod.id,
          status: options.status ?? "won",
          winnerCustomerId: winnerCustomer.id,
        })
        return { farmer, winnerCustomer, lotId }
      }

      it("returns the full address and writes exactly one audit row (AC4, AC5)", async () => {
        const { farmer, lotId } = await seedSold({
          addresses: [{ is_default_shipping: true }],
        })
        const before = Date.now()

        const res = await api.post(
          `/vendor/sold-lots/${lotId}/reveal`,
          { field: "shipping_address" },
          { headers: farmer.vendor }
        )
        expect(res.status).toEqual(200)
        expect(res.data).toEqual({
          field: "shipping_address",
          value: {
            first_name: "Siti",
            last_name: "Rahmawati",
            address_1: STREET,
            address_2: "RT 01",
            postal_code: POSTAL,
            city: CITY,
            province: PROVINCE,
            country_code: "id",
          },
        })
        expect(res.data.value).not.toHaveProperty("phone")
        expect(res.data.value).not.toHaveProperty("company")

        const rows = await auditRows(lotId)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
          actor_type: "member",
          record_type: "lot",
          record_id: lotId,
          field: "shipping_address",
        })
        expect(rows[0].actor_id).toBeTruthy()
        expect(new Date(rows[0].created_at).getTime()).toBeGreaterThanOrEqual(before - 1000)

        // A second reveal writes a second row: every reveal is recorded.
        await api.post(
          `/vendor/sold-lots/${lotId}/reveal`,
          { field: "shipping_address" },
          { headers: farmer.vendor }
        )
        expect(await auditRows(lotId)).toHaveLength(2)
      })

      it("404s with no row when the winner has no default address (AC5, D-056)", async () => {
        const { farmer, lotId } = await seedSold({
          addresses: [{ is_default_shipping: false }],
        })
        expect(
          await statusOf(
            api.post(
              `/vendor/sold-lots/${lotId}/reveal`,
              { field: "shipping_address" },
              { headers: farmer.vendor }
            )
          )
        ).toEqual(404)
        expect(await auditRows(lotId)).toHaveLength(0)
      })

      it("404s another seller's lot and a non-sold lot, with no row (AC5)", async () => {
        const owner = await seedSold({ addresses: [{ is_default_shipping: true }] })
        const other = await registerFarm()

        expect(
          await statusOf(
            api.post(
              `/vendor/sold-lots/${owner.lotId}/reveal`,
              { field: "shipping_address" },
              { headers: other.vendor }
            )
          )
        ).toEqual(404)

        const open_ = await seedSold({
          addresses: [{ is_default_shipping: true }],
          status: "open",
        })
        expect(
          await statusOf(
            api.post(
              `/vendor/sold-lots/${open_.lotId}/reveal`,
              { field: "shipping_address" },
              { headers: open_.farmer.vendor }
            )
          )
        ).toEqual(404)

        expect(await auditRows(owner.lotId)).toHaveLength(0)
        expect(await auditRows(open_.lotId)).toHaveLength(0)
      })

      it("refuses a phone field, and a non-member token (AC5, D-052)", async () => {
        const { farmer, lotId } = await seedSold({
          addresses: [{ is_default_shipping: true }],
        })
        const reveal = (headers: Record<string, string>, body: unknown) =>
          statusOf(
            api.post(`/vendor/sold-lots/${lotId}/reveal`, body, { headers })
          )

        expect(await reveal(farmer.vendor, { field: "phone" })).toEqual(400)
        expect(await reveal(farmer.vendor, {})).toEqual(400)
        expect(await reveal(farmer.customerHeaders, { field: "shipping_address" })).toEqual(401)
        expect(await auditRows(lotId)).toHaveLength(0)
      })
    })

    describe("paid", () => {
      const seedPayable = async (options: { status?: LotStatus } = {}) => {
        const farmer = await registerFarm()
        const winnerCustomer = await winner([])
        const a = await auction(farmer.seller.id)
        const prod = await p(`p${Math.random().toString(36).slice(2, 6)}`)
        const lotId = await lot({
          auctionId: a,
          productId: prod.id,
          status: options.status ?? "won",
          winnerCustomerId: winnerCustomer.id,
        })
        return { farmer, winnerCustomer, lotId }
      }

      const pay = (headers: Record<string, string>, lotId: string) =>
        statusOf(api.post(`/vendor/sold-lots/${lotId}/paid`, {}, { headers }))

      it("marks a won lot paid (AC1)", async () => {
        const { farmer, lotId } = await seedPayable()
        const res = await api.post(
          `/vendor/sold-lots/${lotId}/paid`,
          {},
          { headers: farmer.vendor }
        )
        expect(res.status).toEqual(200)
        expect(res.data.lot).toMatchObject({ id: lotId, status: "paid" })
        expect((await auctions().retrieveLot(lotId)).status).toEqual("paid")
      })

      it("refuses paid, shipped, delivered and cancelled lots with 409 (AC1)", async () => {
        for (const status of [
          "paid",
          "shipped",
          "delivered",
          "cancelled",
        ] as LotStatus[]) {
          const seeded = await seedPayable({ status })
          expect(await pay(seeded.farmer.vendor, seeded.lotId)).toEqual(409)
          expect((await auctions().retrieveLot(seeded.lotId)).status).toEqual(
            status
          )
        }
        // A second mark is refused too.
        const twice = await seedPayable()
        expect(await pay(twice.farmer.vendor, twice.lotId)).toEqual(200)
        expect(await pay(twice.farmer.vendor, twice.lotId)).toEqual(409)
      })

      it("404s another seller's lot and leaves it unchanged (AC1)", async () => {
        const owner = await seedPayable()
        const other = await registerFarm()
        expect(await pay(other.vendor, owner.lotId)).toEqual(404)
        expect((await auctions().retrieveLot(owner.lotId)).status).toEqual("won")
      })

      it("refuses anonymous callers with 401", async () => {
        const { lotId } = await seedPayable()
        expect(await statusOf(api.post(`/vendor/sold-lots/${lotId}/paid`, {}))).toEqual(
          401
        )
        expect((await auctions().retrieveLot(lotId)).status).toEqual("won")
      })

      it("allows a suspended farm and refuses a terminated one (AC4, D-054)", async () => {
        const container = getContainer()
        const suspended = await seedPayable()
        await suspendSellerWorkflow(container).run({
          input: { seller_id: suspended.farmer.seller.id, reason: "qa suspend" },
        })
        expect(await pay(suspended.farmer.vendor, suspended.lotId)).toEqual(200)

        const terminated = await seedPayable()
        await terminateSellerWorkflow(container).run({
          input: { seller_id: terminated.farmer.seller.id, reason: "qa terminate" },
        })
        expect(await pay(terminated.farmer.vendor, terminated.lotId)).toEqual(403)
        expect((await auctions().retrieveLot(terminated.lotId)).status).toEqual(
          "won"
        )
      })

      it("moves no money: no ledger row, no balance change (D-058)", async () => {
        const { farmer, lotId } = await seedPayable()
        const walletService =
          getContainer().resolve<WalletModuleService>(WALLET_MODULE)
        const [farmerWallet] = await walletService.createWallets([{}])
        const [winnerWallet] = await walletService.createWallets([{}])
        await walletService.createWalletTransactions([
          { wallet_id: farmerWallet.id, type: "manual_topup", amount: 70_000 },
          { wallet_id: winnerWallet.id, type: "manual_topup", amount: 90_000 },
        ])

        const before = await walletService.listWalletTransactions()
        const balanceBefore = await Promise.all(
          before.map((t) => Number(t.amount))
        ).then((amounts) => amounts.reduce((sum, n) => sum + n, 0))

        expect(await pay(farmer.vendor, lotId)).toEqual(200)

        const after = await walletService.listWalletTransactions()
        expect(after).toHaveLength(before.length)
        expect(after.reduce((sum, t) => sum + Number(t.amount), 0)).toEqual(
          balanceBefore
        )
        // Both seeded wallets are untouched.
        expect(
          await walletService.listWalletTransactions({ wallet_id: farmerWallet.id })
        ).toHaveLength(1)
        expect(
          await walletService.listWalletTransactions({ wallet_id: winnerWallet.id })
        ).toHaveLength(1)
      })
    })

    describe("shipped", () => {
      const seedShippable = async (options: {
        status?: LotStatus
        deliveryMethod?: "courier" | "self_delivery"
      } = {}) => {
        const farmer = await registerFarm()
        const winnerCustomer = await winner([])
        const a = await auction(
          farmer.seller.id,
          "closed",
          options.deliveryMethod ?? "courier"
        )
        const prod = await p(`s${Math.random().toString(36).slice(2, 6)}`)
        const lotId = await lot({
          auctionId: a,
          productId: prod.id,
          status: options.status ?? "paid",
          winnerCustomerId: winnerCustomer.id,
        })
        return { farmer, winnerCustomer, lotId }
      }

      const ship = (
        headers: Record<string, string>,
        lotId: string,
        body?: unknown
      ) =>
        statusOf(
          api.post(`/vendor/sold-lots/${lotId}/shipped`, body, { headers })
        )

      it("ships a paid courier lot with a tracking number (AC1, AC2)", async () => {
        const { farmer, lotId } = await seedShippable()
        const res = await api.post(
          `/vendor/sold-lots/${lotId}/shipped`,
          { tracking_number: "  JNE123  " },
          { headers: farmer.vendor }
        )
        expect(res.status).toEqual(200)
        expect(res.data.lot).toMatchObject({
          id: lotId,
          status: "shipped",
          tracking_number: "JNE123",
        })

        const row = await auctions().retrieveLot(lotId)
        expect(row.status).toEqual("shipped")
        expect(row.tracking_number).toEqual("JNE123")
        expect(row.shipped_at).toBeTruthy()
      })

      it("refuses won, open and shipped lots with 409 (AC1)", async () => {
        const won = await seedShippable({ status: "won" })
        expect(
          await ship(won.farmer.vendor, won.lotId, { tracking_number: "X1" })
        ).toEqual(409)
        expect((await auctions().retrieveLot(won.lotId)).status).toEqual("won")

        const open_ = await seedShippable({ status: "open" })
        expect(
          await ship(open_.farmer.vendor, open_.lotId, { tracking_number: "X1" })
        ).toEqual(409)

        const twice = await seedShippable()
        expect(
          await ship(twice.farmer.vendor, twice.lotId, { tracking_number: "X1" })
        ).toEqual(200)
        expect(
          await ship(twice.farmer.vendor, twice.lotId, { tracking_number: "X2" })
        ).toEqual(409)
        expect((await auctions().retrieveLot(twice.lotId)).tracking_number).toEqual(
          "X1"
        )
      })

      it("requires a tracking number for courier, not for self-delivery (AC2)", async () => {
        const courier = await seedShippable()
        expect(await ship(courier.farmer.vendor, courier.lotId, {})).toEqual(400)
        expect(
          await ship(courier.farmer.vendor, courier.lotId, { tracking_number: "   " })
        ).toEqual(400)
        expect((await auctions().retrieveLot(courier.lotId)).status).toEqual("paid")

        const self = await seedShippable({ deliveryMethod: "self_delivery" })
        const res = await api.post(
          `/vendor/sold-lots/${self.lotId}/shipped`,
          {},
          { headers: self.farmer.vendor }
        )
        expect(res.status).toEqual(200)
        expect(res.data.lot.tracking_number).toBeNull()
      })

      it("404s another seller's lot and leaves it unchanged (AC1)", async () => {
        const owner = await seedShippable()
        const other = await registerFarm()
        expect(
          await ship(other.vendor, owner.lotId, { tracking_number: "NOPE" })
        ).toEqual(404)
        expect((await auctions().retrieveLot(owner.lotId)).status).toEqual("paid")
      })

      it("keeps winner and final price unchanged (D-026)", async () => {
        const { farmer, winnerCustomer, lotId } = await seedShippable()
        await ship(farmer.vendor, lotId, { tracking_number: "JNE9" })
        const row = await auctions().retrieveLot(lotId)
        expect(row.winner_customer_id).toEqual(winnerCustomer.id)
        expect(Number(row.final_price)).toEqual(1_500_000)
      })

      it("restores the lot when a later step fails (compensation)", async () => {
        const { lotId } = await seedShippable()
        const run = await setLotFieldsThenFailWorkflow(getContainer()).run({
          input: { id: lotId, update: { status: "shipped" } },
          throwOnError: false,
        })
        expect(run.errors?.length).toBeGreaterThan(0)
        const row = await auctions().retrieveLot(lotId)
        expect(row.status).toEqual("paid")
        expect(row.shipped_at).toBeNull()
      })

      it("allows a suspended farm and refuses a terminated one (AC4, D-054)", async () => {
        const container = getContainer()
        const suspended = await seedShippable()
        await suspendSellerWorkflow(container).run({
          input: { seller_id: suspended.farmer.seller.id, reason: "qa suspend" },
        })
        expect(
          await ship(suspended.farmer.vendor, suspended.lotId, {
            tracking_number: "SUS1",
          })
        ).toEqual(200)

        const terminated = await seedShippable()
        await terminateSellerWorkflow(container).run({
          input: { seller_id: terminated.farmer.seller.id, reason: "qa terminate" },
        })
        expect(
          await ship(terminated.farmer.vendor, terminated.lotId, {
            tracking_number: "TER1",
          })
        ).toEqual(403)
        expect((await auctions().retrieveLot(terminated.lotId)).status).toEqual(
          "paid"
        )
      })
    })
  },
})
