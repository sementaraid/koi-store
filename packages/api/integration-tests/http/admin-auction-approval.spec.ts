import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import {
  approveSellerWorkflow,
  createSellerAccountWorkflow,
} from "@mercurjs/core/workflows"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { createCustomerWalletWorkflow } from "../../src/workflows/create-customer-wallet"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"

jest.setTimeout(120 * 1000)

// US-032 T-032.1/T-032.4 + US-031 T-031.4: the admin queue, approve (with the
// listing-fee charge) and reject.

const DAY = 24 * 60 * 60 * 1000
type HttpResponse = { status: number; data: { message?: string; code?: string } }

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const adminJwt = (container: MedusaContainer, userId: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  return generateJwtToken(
    { actor_id: userId, actor_type: "user", auth_identity_id: "", app_metadata: {}, user_metadata: {} },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let admin: Record<string, string>
    let adminId: string

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `auction-admin-${Date.now()}@test.dev` }])
      adminId = user.id
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
    })

    const wallets = () => getContainer().resolve<WalletModuleService>(WALLET_MODULE)
    const auctions = () => getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    // An approved farm (US-020/US-021) whose customer wallet holds `balance`,
    // with a submitted auction of `lots` lots at Rp50.000 per lot.
    const pendingAuction = async (balance: number, lots = 2) => {
      const container = getContainer()
      const email = `approve-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", { body: { email, password } })
      const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
        { email, first_name: "Budi", last_name: "Santoso", phone: "+6281234567890" },
      ])
      await auth.updateAuthIdentities({ id: authIdentity!.id, app_metadata: { customer_id: customer.id } })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: { name: `Kebun ${Date.now()}`, email, currency_code: "idr" },
          payment_details: { holder_name: "Budi Santoso", bank_name: "BCA", account_number: "1234567890" },
        },
      })
      await approveSellerWorkflow(container).run({ input: { seller_id: seller.id } })
      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const vendor = { authorization: `Bearer ${signIn.data.token}`, "x-seller-id": seller.id }

      await createCustomerWalletWorkflow(container).run({ input: { customer_id: customer.id } })
      const {
        data: [row],
      } = await container
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({ entity: "customer", fields: ["wallet.id"], filters: { id: customer.id } })
      const walletId = row.wallet!.id as string
      await wallets().createWalletTransactions([
        { wallet_id: walletId, type: "manual_topup", amount: balance, reference: "test" },
      ])

      const {
        result: [category],
      } = await createFeeCategoriesWorkflow(container).run({
        input: {
          fee_categories: [
            { name: `Kategori ${Date.now()}-${Math.random()}`, listing_fee: 50_000, join_fee: 100_000 },
          ],
        },
      })
      const created = await api.post(
        "/vendor/auctions",
        {
          fee_category_id: category.id,
          start_at: new Date(Date.now() + DAY).toISOString(),
          end_at: new Date(Date.now() + 3 * DAY).toISOString(),
          delivery_method: "courier",
          lots: Array.from({ length: lots }, (_, i) => ({
            // Product handles are unique, so titles are too.
            title: `Kohaku ${i} ${email}`,
            photos: ["http://localhost:9000/static/koi.jpg"],
            ob: 1_000_000,
            kb: 100_000,
          })),
        },
        { headers: vendor }
      )
      const auctionId = created.data.auction.id as string
      await api.post(`/vendor/auctions/${auctionId}/submit`, {}, { headers: vendor })

      return { auctionId, walletId, vendor, customer, category, seller }
    }

    const ledger = (walletId: string) => wallets().listWalletTransactions({ wallet_id: walletId })
    const balanceOf = async (walletId: string) =>
      (await ledger(walletId)).reduce((sum, t) => sum + Number(t.amount), 0)

    it("lists only pending_approval auctions with category, lots with photos and fees; drafts never show (US-032 AC1)", async () => {
      const { auctionId, category, seller } = await pendingAuction(1_000_000)
      // A draft from another farm.
      const draft = await pendingAuction(1_000_000)
      await auctions().updateAuctions([{ id: draft.auctionId, status: "draft" }])

      const queue = await api.get("/admin/auctions?limit=100", { headers: admin })
      expect(queue.status).toEqual(200)
      const ids = queue.data.auctions.map((a: { id: string }) => a.id)
      expect(ids).toContain(auctionId)
      expect(ids).not.toContain(draft.auctionId)
      expect(queue.data.auctions.every((a: { status: string }) => a.status === "pending_approval")).toBe(true)

      const entry = queue.data.auctions.find((a: { id: string }) => a.id === auctionId)
      expect(entry).toMatchObject({
        listing_fee: 100_000,
        join_fee: 100_000,
        seller: { id: seller.id },
        fee_category: { id: category.id, listing_fee: 50_000, join_fee: 100_000 },
      })
      expect(entry.lots).toHaveLength(2)
      expect(entry.lots[0]).toMatchObject({
        title: expect.stringMatching(/^Kohaku/),
        photos: ["http://localhost:9000/static/koi.jpg"],
      })

      // Admin only (D-002).
      expect((await failure(api.get("/admin/auctions"))).status).toEqual(401)
      expect((await failure(api.get("/admin/auctions", { headers: draft.vendor }))).status).toEqual(401)
    })

    it("approves: pending_approval → scheduled and exactly one listing_fee at the recomputed fee (US-032 AC2, US-031 AC5)", async () => {
      const { auctionId, walletId } = await pendingAuction(300_000)

      const approved = await api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin })
      expect(approved.status).toEqual(200)
      expect(approved.data.auction.status).toEqual("scheduled")
      expect(approved.data.wallet_transaction).toMatchObject({
        type: "listing_fee",
        amount: -100_000,
        reference: auctionId,
        created_by: adminId,
      })

      const fees = (await ledger(walletId)).filter((t) => t.type === "listing_fee")
      expect(fees.map((t) => Number(t.amount))).toEqual([-100_000])
      expect(await balanceOf(walletId)).toEqual(200_000)

      // A second approval is refused (409) and charges nothing more.
      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin }))).status
      ).toEqual(409)
      expect((await ledger(walletId)).filter((t) => t.type === "listing_fee")).toHaveLength(1)
    })

    it("fails approval when the balance dropped below the fee, saving nothing (US-031 AC6)", async () => {
      const { auctionId, walletId } = await pendingAuction(100_000)
      // Spent after submit: balance now Rp99.999 against Rp100.000.
      await wallets().createWalletTransactions([
        { wallet_id: walletId, type: "adjustment", amount: -1, reference: "spent" },
      ])

      const refused = await failure(api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin }))
      expect(refused.status).toEqual(400)
      expect(refused.data.code).toEqual("insufficient_balance")

      const stored = await auctions().retrieveAuction(auctionId)
      expect(stored.status).toEqual("pending_approval")
      expect((await ledger(walletId)).filter((t) => t.type === "listing_fee")).toHaveLength(0)
      expect(await balanceOf(walletId)).toEqual(99_999)
    })

    it("rolls back the status when the charge fails after it (US-031 AC7)", async () => {
      const { auctionId, walletId } = await pendingAuction(300_000)
      const spy = jest
        .spyOn(wallets(), "createWalletTransactions")
        .mockRejectedValueOnce(new Error("simulated charge failure"))

      const failed = await failure(api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin }))
      spy.mockRestore()
      expect(failed.status).toEqual(500)

      // Compensation put it back: still pending, no override, no charge.
      const stored = await auctions().retrieveAuction(auctionId)
      expect(stored.status).toEqual("pending_approval")
      expect((await ledger(walletId)).filter((t) => t.type === "listing_fee")).toHaveLength(0)

      // A retry charges exactly once.
      const retried = await api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin })
      expect(retried.data.auction.status).toEqual("scheduled")
      expect((await ledger(walletId)).filter((t) => t.type === "listing_fee")).toHaveLength(1)
    })

    it("override needs a reason, is saved, and the charge uses it (US-032 AC3, US-031 AC5)", async () => {
      // Submitted with Rp100.000, then down to Rp60.000: covers the Rp50.000
      // override but not the Rp100.000 fee.
      const { auctionId, walletId } = await pendingAuction(100_000)
      await wallets().createWalletTransactions([
        { wallet_id: walletId, type: "adjustment", amount: -40_000, reference: "spent" },
      ])
      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin }))).data.code
      ).toEqual("insufficient_balance")
      const approve = (body: Record<string, unknown>) =>
        failure(api.post(`/admin/auctions/${auctionId}/approve`, body, { headers: admin }))

      expect((await approve({ listing_fee: 50_000 })).status).toEqual(400)
      expect((await approve({ listing_fee: 50_000, reason: "  " })).status).toEqual(400)
      expect((await approve({ reason: "Promo kebun baru" })).status).toEqual(400)
      expect((await approve({ listing_fee: 1.5, reason: "x" })).status).toEqual(400)
      expect((await approve({ listing_fee: -1, reason: "x" })).status).toEqual(400)
      expect((await auctions().retrieveAuction(auctionId)).status).toEqual("pending_approval")

      const approved = await api.post(
        `/admin/auctions/${auctionId}/approve`,
        { listing_fee: 50_000, join_fee: 75_000, reason: "Promo kebun baru" },
        { headers: admin }
      )
      expect(approved.data.auction).toMatchObject({
        status: "scheduled",
        fee_override_listing_fee: 50_000,
        fee_override_join_fee: 75_000,
        fee_override_reason: "Promo kebun baru",
      })
      expect(approved.data.wallet_transaction.amount).toEqual(-50_000)
      expect(await balanceOf(walletId)).toEqual(10_000)
    })

    it("reject needs a reason, returns draft, clears the override, writes no refund, and the farmer reads it (US-032 AC4, AC5, US-031 AC8)", async () => {
      const { auctionId, walletId, vendor } = await pendingAuction(300_000)
      // An override left from an earlier approval attempt (D-032).
      await auctions().updateAuctions([
        { id: auctionId, fee_override_listing_fee: 10_000, fee_override_reason: "Promo" },
      ])
      const before = (await ledger(walletId)).length

      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/reject`, {}, { headers: admin }))).status
      ).toEqual(400)
      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/reject`, { reason: " " }, { headers: admin })))
          .status
      ).toEqual(400)

      const reason = "Foto lot 2 buram."
      const rejected = await api.post(`/admin/auctions/${auctionId}/reject`, { reason }, { headers: admin })
      expect(rejected.data.auction).toMatchObject({
        status: "draft",
        rejection_reason: reason,
        fee_override_listing_fee: null,
        fee_override_join_fee: null,
        fee_override_reason: null,
      })
      expect((await ledger(walletId)).length).toEqual(before)

      // The farmer sees the reason through /vendor (T-032.5).
      const mine = await api.get(`/vendor/auctions/${auctionId}`, { headers: vendor })
      expect(mine.data.auction).toMatchObject({ status: "draft", rejection_reason: reason })
      const list = await api.get("/vendor/auctions?status=draft", { headers: vendor })
      expect(list.data.auctions.find((a: { id: string }) => a.id === auctionId).rejection_reason).toEqual(reason)

      // Gone from the queue, and a draft can't be decided again.
      const queue = await api.get("/admin/auctions?limit=100", { headers: admin })
      expect(queue.data.auctions.map((a: { id: string }) => a.id)).not.toContain(auctionId)
      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/reject`, { reason }, { headers: admin }))).status
      ).toEqual(409)
      expect(
        (await failure(api.post(`/admin/auctions/${auctionId}/approve`, {}, { headers: admin }))).status
      ).toEqual(409)

      // Resubmit clears the reason and goes back to the queue.
      const resubmitted = await api.post(`/vendor/auctions/${auctionId}/submit`, {}, { headers: vendor })
      expect(resubmitted.data.auction).toMatchObject({ status: "pending_approval", rejection_reason: null })
    })
  },
})
