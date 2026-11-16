import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { updatePlatformSettingsWorkflow } from "../../src/workflows/update-platform-settings"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { createCustomerWalletWorkflow } from "../../src/workflows/create-customer-wallet"
import { createStep, createWorkflow, StepResponse } from "@medusajs/framework/workflows-sdk"
import { setLotsEndTimeStep } from "../../src/workflows/steps/auction"

// US-030 T-030.8: the real step, plus a step that fails after it, so the
// workflow's compensation actually runs. A step only builds inside a workflow
// definition, so the check cannot call it on its own.
const failAfterLotsStep = createStep(
  "qa-fail-after-lots",
  async () => {
    throw new Error("qa: simulated failure after setLotsEndTimeStep")
  }
)

const setLotsEndTimeTestWorkflow = createWorkflow(
  "set-lots-end-time-test",
  function (input: { auction_id: string; end_ms: number }) {
    setLotsEndTimeStep(input)
    failAfterLotsStep()
  }
)

jest.setTimeout(120 * 1000)

// US-030 T-030.1/T-030.2/T-030.6: the auction module, the create-auction
// workflow and the /vendor/auctions routes. Same registration sequence as
// admin-farms.spec.ts: a real seller, a member token plus `x-seller-id`.

const DAY = 24 * 60 * 60 * 1000
type HttpError = { response: { status: number; data: { message?: string } } }

const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: Record<string, string>

    beforeEach(async () => {
      const container = getContainer()
      const [key] = await container
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    // A farmer as US-020 leaves one: a customer and member on one identity, a
    // seller. `open` when asked to approve it.
    const registerFarm = async (options: { approve?: boolean } = {}) => {
      const container = getContainer()
      const email = `auction-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email, first_name: "Budi", last_name: "Santoso", phone: "+6281234567890" },
      ])
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
      if (options.approve) {
        await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
      }

      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const vendor = {
        authorization: `Bearer ${signIn.data.token}`,
        "x-seller-id": seller.id,
      }
      return { seller, customer, vendor }
    }

    // A fee table row with the amounts this suite asserts on.
    const createCategory = async (suffix: string) => {
      const { result } = await createFeeCategoriesWorkflow(getContainer()).run({
        input: {
          fee_categories: [
            {
              name: `Kategori ${Date.now()}-${suffix}`,
              listing_fee: 50_000,
              join_fee: 100_000,
            },
          ],
        },
      })
      return result[0]
    }

    const photo = "http://localhost:9000/static/koi.jpg"

    const lot = (overrides: Record<string, unknown> = {}) => ({
      title: "Kohaku 55",
      description: "Maruten bersih.",
      photos: [photo],
      ob: 1_000_000,
      kb: 100_000,
      ...overrides,
    })

    const auctionBody = (
      fee_category_id: string,
      overrides: Record<string, unknown> = {}
    ) => ({
      fee_category_id,
      start_at: iso(DAY),
      end_at: iso(3 * DAY),
      delivery_method: "courier",
      lots: [lot()],
      ...overrides,
    })

    const auctionById = async (id: string) => {
      const {
        data: [auction],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "auction",
          fields: [
            "id",
            "seller_id",
            "status",
            "listing_fee",
            "join_fee",
            "extend_window_minutes",
            "lots.id",
            "lots.ob",
            "lots.kb",
            "lots.current_price",
            "lots.status",
            "lots.product_id",
          ],
          filters: { id },
        })
      return auction
    }

    it("creates a draft auction with the fee and extend-window snapshots (AC1, AC2, AC4, AC6, AC7, AC8)", async () => {
      const container = getContainer()
      const { vendor } = await registerFarm({ approve: true })
      const category = await createCategory("a")
      await updatePlatformSettingsWorkflow(container).run({
        input: { update: { extend_window_minutes: 9 } },
      })

      const created = await api.post(
        "/vendor/auctions",
        auctionBody(category.id, {
          lots: [
            lot(),
            lot({ title: "Sanke 50", ob: 2_000_000, kb: 250_000 }),
          ],
        }),
        { headers: vendor }
      )

      expect(created.status).toEqual(201)
      const auction = created.data.auction
      // AC8: a new auction is draft.
      expect(auction.status).toEqual("draft")
      // AC4 + D-032: listing fee = the category's per-lot fee × lots; join fee
      // is the category's join fee. The body never carried a fee.
      expect(auction.listing_fee).toEqual(100_000)
      expect(auction.join_fee).toEqual(100_000)
      // AC6: the extend window in force at creation is stored.
      expect(auction.extend_window_minutes).toEqual(9)
      expect(auction.lots).toHaveLength(2)

      const stored = await auctionById(auction.id)
      expect(stored.status).toEqual("draft")
      expect(stored.listing_fee).toEqual(100_000)
      expect(stored.extend_window_minutes).toEqual(9)
      // AC2: current price starts at OB; the lot is open.
      const lots = (stored.lots ?? []) as {
        ob: number
        current_price: number
        status: string
        product_id: string
      }[]
      expect(
        lots.map((l) => [l.ob, l.current_price, l.status])
      ).toEqual([
        [1_000_000, 1_000_000, "open"],
        [2_000_000, 2_000_000, "open"],
      ])
      // Every lot has its own Mercur product (photos + description live there).
      const productIds = lots.map((l) => l.product_id)
      expect(new Set(productIds).size).toEqual(2)

      // The readOnly links resolve: auction → seller, lot → product.
      const {
        data: [linked],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "auction",
          fields: ["seller.id", "lots.product.id", "lots.product.thumbnail"],
          filters: { id: auction.id },
        })
      expect(linked.seller?.id).toEqual(stored.seller_id)
      const linkedLots = (linked.lots ?? []) as {
        product?: { id?: string; thumbnail?: string } | null
      }[]
      expect(linkedLots.map((l) => l.product)).toEqual([
        { id: productIds[0], thumbnail: photo },
        { id: productIds[1], thumbnail: photo },
      ])
    })

    it("serves every lot from the auction's single category (AC3)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const category = await createCategory("b")
      const other = await createCategory("other")

      const created = await api.post(
        "/vendor/auctions",
        auctionBody(category.id, {
          lots: [lot(), lot({ title: "Showa 60", ob: 3_000_000, kb: 500_000 })],
        }),
        { headers: vendor }
      )
      expect(created.status).toEqual(201)

      const {
        data: [row],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "auction",
          fields: ["fee_category_id", "lots.id"],
          filters: { id: created.data.auction.id },
        })
      // One category on the auction, and nothing per lot that could differ.
      expect(row.fee_category_id).toEqual(category.id)
      expect(row.fee_category_id).not.toEqual(other.id)
      expect(row.lots).toHaveLength(2)
    })

    it("keeps the stored extend window and fees when settings or the fee table change later (AC6, AC7)", async () => {
      const container = getContainer()
      const { vendor } = await registerFarm({ approve: true })
      const category = await createCategory("c")

      const created = await api.post("/vendor/auctions", auctionBody(category.id), {
        headers: vendor,
      })
      expect(created.status).toEqual(201)
      const before = await auctionById(created.data.auction.id)

      // A later settings change and a later fee-table change.
      await updatePlatformSettingsWorkflow(container).run({
        input: { update: { extend_window_minutes: 15 } },
      })
      const platformSettings = container.resolve<
        import("../../src/modules/platform-settings/service").default
      >("platform_settings")
      await platformSettings.updateFeeCategories([
        { id: category.id, listing_fee: 999_000, join_fee: 999_000 },
      ])

      const after = await auctionById(created.data.auction.id)
      expect(after.extend_window_minutes).toEqual(before.extend_window_minutes)
      expect(after.listing_fee).toEqual(before.listing_fee)
      expect(after.join_fee).toEqual(before.join_fee)
    })

    it("refuses a seller whose farm is not open, and a non-member (AC5)", async () => {
      const container = getContainer()
      const category = await createCategory("d")
      const pending = await registerFarm()

      expect(
        await statusOf(
          api.post("/vendor/auctions", auctionBody(category.id), {
            headers: pending.vendor,
          })
        )
      ).toEqual(403)

      // Nothing was written.
      const { data } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "auction",
          fields: ["id"],
          filters: { seller_id: pending.seller.id },
        })
      expect(data).toHaveLength(0)

      // The x-seller-id header is required on /vendor/* routes (Mercur's
      // ensureSellerMiddleware). NOT_ALLOWED maps to 400.
      expect(
        await statusOf(
          api.post("/vendor/auctions", auctionBody(category.id), {
            headers: { authorization: pending.vendor.authorization },
          })
        )
      ).toEqual(400)
    })

    it("enforces the US-015 limits on the server: > max lots, wrong length, missing fields (AC1, AC2)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const category = await createCategory("e")

      const manyLots = Array.from({ length: 21 }, (_, i) =>
        lot({ title: `Koi ${i}` })
      )
      const post = (body: Record<string, unknown>) =>
        statusOf(api.post("/vendor/auctions", body, { headers: vendor }))

      expect(await post(auctionBody(category.id, { lots: manyLots }))).toEqual(400)
      // Length outside auction_min_days..auction_max_days.
      expect(
        await post(auctionBody(category.id, { start_at: iso(0), end_at: iso(8 * DAY) }))
      ).toEqual(400)
      expect(
        await post(auctionBody(category.id, { start_at: iso(DAY), end_at: iso(DAY / 2) }))
      ).toEqual(400)
      // Missing and malformed fields.
      const { fee_category_id: _unused, ...noCategory } = auctionBody(category.id)
      expect(await post(noCategory)).toEqual(400)
      expect(await post(auctionBody("feecat_missing"))).toEqual(400)
      expect(await post(auctionBody(category.id, { delivery_method: "drone" }))).toEqual(400)
      expect(await post(auctionBody(category.id, { lots: [] }))).toEqual(400)
      expect(await post(auctionBody(category.id, { lots: [lot({ photos: [] })] }))).toEqual(400)
      expect(await post(auctionBody(category.id, { lots: [lot({ ob: 1.5 })] }))).toEqual(400)
      // The farmer cannot set fees: a body field is refused, not accepted.
      expect(
        await post(auctionBody(category.id, { listing_fee: 1, join_fee: 1 }))
      ).toEqual(400)
    })

    it("edits a draft until submit and stops at submit; another seller's auction is 404 (AC8)", async () => {
      const container = getContainer()
      const { seller, vendor } = await registerFarm({ approve: true })
      const category = await createCategory("f")

      const created = await api.post("/vendor/auctions", auctionBody(category.id), {
        headers: vendor,
      })
      expect(created.status).toEqual(201)
      const auctionId = created.data.auction.id

      const updated = await api.post(
        `/vendor/auctions/${auctionId}`,
        { delivery_method: "self_delivery", end_at: iso(5 * DAY) },
        { headers: vendor }
      )
      expect(updated.status).toEqual(200)
      expect(updated.data.auction.delivery_method).toEqual("self_delivery")
      // The fees stay the creation snapshot.
      expect(updated.data.auction.listing_fee).toEqual(
        created.data.auction.listing_fee
      )

      // T-030.8: the lots follow the new end_at, and a lot added after the
      // edit takes it too.
      const lotEndTimes = async () =>
        (
          await container
            .resolve<AuctionModuleService>(AUCTION_MODULE)
            .listLots({ auction_id: auctionId }, { select: ["end_time"] })
        ).map((l) => new Date(l.end_time).toISOString())
      const newEnd = new Date(updated.data.auction.end_at).toISOString()
      expect(await lotEndTimes()).toEqual([newEnd])
      const addedLot = await api.post(
        `/vendor/auctions/${auctionId}/lots`,
        { lots: [lot({ title: `Showa ${Date.now()}` })] },
        { headers: vendor }
      )
      expect(addedLot.status).toEqual(201)
      expect(await lotEndTimes()).toEqual([newEnd, newEnd])

      // A body that tries to set a fee is refused.
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}`, { listing_fee: 1 }, { headers: vendor })
        )
      ).toEqual(400)

      // Once submitted (US-031), the draft edit stops. Simulated here because
      // the submit workflow is US-031's task.
      await container
        .resolve<AuctionModuleService>(AUCTION_MODULE)
        .updateAuctions([{ id: auctionId, status: "pending_approval" }])
      expect(
        await statusOf(
          api.post(
            `/vendor/auctions/${auctionId}`,
            { delivery_method: "courier" },
            { headers: vendor }
          )
        )
      ).toEqual(409)

      // Another seller cannot edit or list it.
      const other = await registerFarm({ approve: true })
      expect(
        await statusOf(
          api.post(
            `/vendor/auctions/${auctionId}`,
            { delivery_method: "courier" },
            { headers: other.vendor }
          )
        )
      ).toEqual(404)

      const mine = await api.get("/vendor/auctions", { headers: other.vendor })
      expect(mine.status).toEqual(200)
      expect(mine.data.auctions.map((a: { id: string }) => a.id)).not.toContain(
        auctionId
      )
      const theirs = await api.get("/vendor/auctions", { headers: vendor })
      expect(theirs.data.auctions.map((a: { id: string }) => a.id)).toContain(
        auctionId
      )
      expect(theirs.data.auctions[0].seller_id).toEqual(seller.id)
    })

    // US-031: the customer's wallet (D-011) holding `amount` rupiah.
    const fundWallet = async (customerId: string, amount: number) => {
      const container = getContainer()
      await createCustomerWalletWorkflow(container).run({
        input: { customer_id: customerId },
      })
      const {
        data: [row],
      } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "customer", fields: ["wallet.id"], filters: { id: customerId } })
      const walletId = row.wallet!.id as string
      if (amount) {
        await container.resolve<WalletModuleService>(WALLET_MODULE).createWalletTransactions([
          { wallet_id: walletId, type: "manual_topup", amount, reference: "test" },
        ])
      }
      return walletId
    }

    const listingFeeRows = async (walletId: string) =>
      (
        await getContainer()
          .resolve<WalletModuleService>(WALLET_MODULE)
          .listWalletTransactions({ wallet_id: walletId, type: "listing_fee" })
      ).length

    // US-030 T-030.8, the half the edit test above cannot show: the test runner
    // rolls a failed workflow's steps back in memory, so a broken compensation
    // still ends with the old end_times. This runs the real step, then fails a
    // step after it, so the compensation has to put the old end_times back.
    it("setLotsEndTimeStep's compensation puts every lot's old end_time back (US-030 T-030.8)", async () => {
      const container = getContainer()
      const auctionsSvc = container.resolve<AuctionModuleService>(AUCTION_MODULE)
      const { seller } = await registerFarm({ approve: true })
      const category = await createCategory("g")
      const [auction] = await auctionsSvc.createAuctions([
        {
          seller_id: seller.id,
          fee_category_id: category.id,
          start_at: new Date(Date.now() + DAY),
          end_at: new Date(Date.now() + 3 * DAY),
          delivery_method: "courier",
          status: "draft",
          listing_fee: 50_000,
          join_fee: 100_000,
          extend_window_minutes: 5,
        },
      ])
      const oldEnd = Date.now() + 2 * DAY
      const [first, second] = await auctionsSvc.createLots([
        { auction_id: auction.id, product_id: "prod_a", ob: 1, kb: 1, current_price: 1, end_time: new Date(oldEnd), status: "open" },
        { auction_id: auction.id, product_id: "prod_b", ob: 1, kb: 1, current_price: 1, end_time: new Date(oldEnd), status: "open" },
      ])

      const newEnd = Date.now() + 6 * DAY
      const input = { auction_id: auction.id, end_ms: newEnd }
      const endTimes = async () =>
        (await auctionsSvc.listLots({ auction_id: auction.id }, { select: ["end_time"] }))
          .map((l) => new Date(l.end_time).getTime())
          .sort()

      // The failing step rolls the mutation back through the real compensation.
      // `run` reports the failure in its own result instead of throwing here,
      // so the assertions are on what is left in the table.
      const run = await setLotsEndTimeTestWorkflow(container)
        .run({ input, throwOnError: false })
      expect(run.errors?.length).toBeGreaterThan(0)

      expect(await endTimes()).toEqual([oldEnd, oldEnd])
      expect([first.id, second.id].sort()).toEqual(
        (await auctionsSvc.listLots({ auction_id: auction.id }, { select: ["id"] })).map((l) => l.id).sort()
      )
    })

    it("submit recomputes the fees from the current table after a category and lot change, and saves the payer from the member token (US-031 AC1–AC3, AC8)", async () => {
      const container = getContainer()
      const { customer, vendor } = await registerFarm({ approve: true })
      const first = await createCategory("s1")
      const second = await createCategory("s2")

      const created = await api.post("/vendor/auctions", auctionBody(first.id), {
        headers: vendor,
      })
      const auctionId = created.data.auction.id
      expect(created.data.auction.listing_fee).toEqual(50_000)

      // Draft lot editing (D-032): add two lots, remove one.
      const added = await api.post(
        `/vendor/auctions/${auctionId}/lots`,
        { lots: [lot({ title: "Showa 45" }), lot({ title: "Asagi 40" })] },
        { headers: vendor }
      )
      expect(added.status).toEqual(201)
      expect(added.data.auction.lots).toHaveLength(3)
      expect(added.data.auction.lots[0].photos).toEqual([photo])
      const removed = await api.delete(
        `/vendor/auctions/${auctionId}/lots/${added.data.auction.lots[2].id}`,
        { headers: vendor }
      )
      expect(removed.data.auction.lots).toHaveLength(2)
      // Lot edits don't touch the fees; submit does.
      expect(removed.data.auction.listing_fee).toEqual(50_000)

      // Another category, and a fee-table change after creation.
      await api.post(`/vendor/auctions/${auctionId}`, { fee_category_id: second.id }, {
        headers: vendor,
      })
      await container
        .resolve<import("../../src/modules/platform-settings/service").default>(
          "platform_settings"
        )
        .updateFeeCategories([{ id: second.id, listing_fee: 70_000, join_fee: 150_000 }])

      const walletId = await fundWallet(customer.id, 140_000)
      const submitted = await api.post(`/vendor/auctions/${auctionId}/submit`, {}, {
        headers: vendor,
      })
      expect(submitted.status).toEqual(200)
      expect(submitted.data.auction).toMatchObject({
        status: "pending_approval",
        // 70.000 × 2 lots; join fee once.
        listing_fee: 140_000,
        join_fee: 150_000,
        // mvp-Q15 verified at runtime: the member token's app_metadata carries
        // the customer_id of the same auth identity.
        payer_customer_id: customer.id,
      })
      // AC8: nothing charged at submit.
      expect(await listingFeeRows(walletId)).toEqual(0)

      // A submitted auction is no longer a draft: no lot edits, no resubmit.
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}/lots`, { lots: [lot()] }, { headers: vendor })
        )
      ).toEqual(409)
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}/submit`, {}, { headers: vendor })
        )
      ).toEqual(409)
    })

    it("guards draft lot edits: last lot, foreign lot, limits, another seller (D-032)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const category = await createCategory("l")
      const created = await api.post("/vendor/auctions", auctionBody(category.id), {
        headers: vendor,
      })
      const auctionId = created.data.auction.id
      const onlyLot = created.data.auction.lots[0].id

      expect(
        await statusOf(api.delete(`/vendor/auctions/${auctionId}/lots/${onlyLot}`, { headers: vendor }))
      ).toEqual(400)
      expect(
        await statusOf(api.delete(`/vendor/auctions/${auctionId}/lots/lot_missing`, { headers: vendor }))
      ).toEqual(404)
      const twenty = Array.from({ length: 20 }, (_, i) => lot({ title: `Koi ${i}` }))
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}/lots`, { lots: twenty }, { headers: vendor })
        )
      ).toEqual(400)
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}/lots`, { lots: [lot({ ob: 0 })] }, { headers: vendor })
        )
      ).toEqual(400)

      const other = await registerFarm({ approve: true })
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${auctionId}/lots`, { lots: [lot()] }, { headers: other.vendor })
        )
      ).toEqual(404)
      expect(
        await statusOf(api.get(`/vendor/auctions/${auctionId}`, { headers: other.vendor }))
      ).toEqual(404)
      expect((await auctionById(auctionId)).lots).toHaveLength(1)
    })

    it("refuses a submit the balance can't cover and changes nothing (US-031 AC4)", async () => {
      const container = getContainer()
      const { customer, vendor } = await registerFarm({ approve: true })
      const category = await createCategory("short")
      const created = await api.post(
        "/vendor/auctions",
        auctionBody(category.id, { lots: [lot(), lot({ title: "Sanke 50" })] }),
        { headers: vendor }
      )
      const auctionId = created.data.auction.id
      // A fee-table change the refused submit must not save.
      await container
        .resolve<import("../../src/modules/platform-settings/service").default>(
          "platform_settings"
        )
        .updateFeeCategories([{ id: category.id, listing_fee: 60_000 }])

      // Rp119.999 against a recomputed fee of Rp120.000.
      const walletId = await fundWallet(customer.id, 119_999)
      const refused = await api
        .post(`/vendor/auctions/${auctionId}/submit`, {}, { headers: vendor })
        .catch((e: HttpError & { response: { data: { code?: string } } }) => e.response)
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")
      // D-055: Indonesian, id-ID rupiah, shown verbatim.
      expect(refused.data.message).toEqual(
        "Saldo Rp119.999 kurang dari biaya pasang lelang Rp120.000."
      )

      const stored = await getContainer()
        .resolve<AuctionModuleService>(AUCTION_MODULE)
        .retrieveAuction(auctionId)
      expect(stored).toMatchObject({
        status: "draft",
        listing_fee: 100_000,
        join_fee: 100_000,
        payer_customer_id: null,
      })
      expect(await listingFeeRows(walletId)).toEqual(0)

      // A farmer with no wallet at all is refused the same way.
      const noWallet = await registerFarm({ approve: true })
      const other = await api.post(
        "/vendor/auctions",
        auctionBody(category.id, { lots: [lot({ title: "Goshiki 30" })] }),
        { headers: noWallet.vendor }
      )
      expect(
        await statusOf(
          api.post(`/vendor/auctions/${other.data.auction.id}/submit`, {}, { headers: noWallet.vendor })
        )
      ).toEqual(400)
    })

    it("refuses submit with 403 when the farm is not open (US-021 AC4)", async () => {
      const { seller, customer, vendor } = await registerFarm()
      const category = await createCategory("closed")
      await fundWallet(customer.id, 1_000_000)
      // The farm can't create one while pending, so the row is written directly.
      const [auction] = await getContainer()
        .resolve<AuctionModuleService>(AUCTION_MODULE)
        .createAuctions([
          {
            seller_id: seller.id,
            fee_category_id: category.id,
            start_at: new Date(Date.now() + DAY),
            end_at: new Date(Date.now() + 3 * DAY),
            delivery_method: "courier",
            listing_fee: 50_000,
            join_fee: 100_000,
            extend_window_minutes: 5,
          },
        ])

      expect(
        await statusOf(api.post(`/vendor/auctions/${auction.id}/submit`, {}, { headers: vendor }))
      ).toEqual(403)
      const stored = await getContainer()
        .resolve<AuctionModuleService>(AUCTION_MODULE)
        .retrieveAuction(auction.id)
      expect(stored.status).toEqual("draft")
      expect(stored.payer_customer_id).toBeNull()
    })
  },
})
