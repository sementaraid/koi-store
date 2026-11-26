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
  suspendSellerWorkflow,
} from "@mercurjs/core/workflows"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"

jest.setTimeout(120 * 1000)

// US-059 T-059.1b (AC2, D-047, D-054, D-055, D-058): the ban gate at exactly
// three actions — join, bid, create auction. 2 active strikes refuse with
// `banned_customer` / `banned_seller` and write nothing; 1 active, one removed
// or one expired (181 days) do not block. Paid, shipped and the farmer's claim
// decision are untouched, as are money rows everywhere.

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000

type HttpResponse = { status: number; data: { code?: string; message?: string } }

const failure = (p: Promise<unknown>) =>
  p.then(
    () => ({ status: 200, data: {} }) as HttpResponse,
    (e: { response: HttpResponse }) => e.response
  )

const jwt = (
  container: MedusaContainer,
  actor_id: string,
  actor_type: "customer" | "member",
  app_metadata: Record<string, unknown> = {}
) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type,
      auth_identity_id: "",
      app_metadata,
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    const backdate = async (id: string, days: number) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.PG_CONNECTION)
        .raw(`UPDATE strike SET created_at = ? WHERE id = ?`, [
          new Date(Date.now() - days * DAY),
          id,
        ])

    // A strike row straight from the module service (T-059.1a's admin routes
    // are covered by strikes.spec.ts; this spec only needs the state).
    const strike = async (customerId: string) => {
      const [row] = await moderation().createStrikes([
        {
          customer_id: customerId,
          seller_id: null,
          lot_id: null,
          reason_type: "winner_unpaid",
          reason: "Pemenang tidak membayar.",
          created_by: "admin_test",
        },
      ])
      return row
    }

    // A customer with a wallet holding `balance` rupiah.
    const customer = async (balance = 150_000) => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `ban-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
        },
      ])
      const [wallet] = await wallets().createWallets([{}])
      await container.resolve(ContainerRegistrationKeys.LINK).create({
        [Modules.CUSTOMER]: { customer_id: row.id },
        [WALLET_MODULE]: { wallet_id: wallet.id },
      })
      await wallets().createWalletTransactions([
        { wallet_id: wallet.id, type: "manual_topup", amount: balance, reference: "test" },
      ])
      return {
        id: row.id,
        walletId: wallet.id,
        auth: {
          authorization: `Bearer ${jwt(container, row.id, "customer")}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    const auction = async (overrides: Record<string, unknown> = {}) => {
      const [row] = await auctions().createAuctions([
        {
          seller_id: "sel_ban",
          fee_category_id: "feecat_ban",
          start_at: new Date(Date.now() - DAY),
          end_at: new Date(Date.now() + DAY),
          delivery_method: "self_delivery",
          listing_fee: 0,
          join_fee: 100_000,
          extend_window_minutes: 5,
          status: "live",
          payer_customer_id: "cus_farmer",
          ...overrides,
        },
      ])
      return row
    }

    const lot = async (auctionId: string, overrides: Record<string, unknown> = {}) => {
      const [row] = await auctions().createLots([
        {
          auction_id: auctionId,
          product_id: "prod_ban",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_000_000,
          end_time: new Date(Date.now() + DAY),
          status: "open",
          ...overrides,
        },
      ])
      return row
    }

    const join = (lotId: string, headers: Record<string, string>) =>
      api.post(`/store/lots/${lotId}/join`, {}, { headers })

    const bid = (
      headers: Record<string, string>,
      lotId: string,
      amount = 1_000_000
    ) => api.post("/store/bids", { lot_id: lotId, amount }, { headers })

    const joinFeeRows = (walletId: string) =>
      wallets()
        .listWalletTransactions({ wallet_id: walletId })
        .then((rows) => rows.filter((t) => t.type === "join_fee"))

    // A farmer as US-020 leaves one: customer + member on one identity (with
    // app_metadata.customer_id), an approved seller, a member token.
    const registerFarm = async () => {
      const container = getContainer()
      const email = `ban-farm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [row] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email, first_name: "Budi", last_name: "Santoso" }])
      await auth.updateAuthIdentities({
        id: authIdentity!.id,
        app_metadata: { customer_id: row.id },
      })
      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            email,
            currency_code: "idr",
          },
        },
      })
      await approveSellerWorkflow(container).run({
        input: { seller_id: seller.id },
      })
      const signIn = await api.post("/auth/member/emailpass", { email, password })
      const {
        data: [withMember],
      } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
        entity: "seller",
        fields: ["id", "members.id"],
        filters: { id: seller.id },
      })
      return {
        seller,
        customer: row,
        memberId: (withMember.members as { id: string }[])[0].id,
        vendor: {
          authorization: `Bearer ${signIn.data.token}`,
          "x-seller-id": seller.id,
        },
      }
    }

    const category = async (suffix: string) => {
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

    const auctionBody = (feeCategoryId: string) => ({
      fee_category_id: feeCategoryId,
      start_at: new Date(Date.now() + DAY).toISOString(),
      end_at: new Date(Date.now() + 3 * DAY).toISOString(),
      delivery_method: "self_delivery",
      lots: [
        {
          title: "Kohaku 55",
          description: "Maruten bersih.",
          photos: ["http://localhost:9000/static/koi.jpg"],
          ob: 1_000_000,
          kb: 100_000,
          // US-105 (D-081): required on every new lot.
          variety: "Kohaku",
          size_cm: 55,
        },
      ],
    })

    const createAuction = (headers: Record<string, string>, body: unknown) =>
      api.post("/vendor/auctions", body, { headers })

    describe("a banned customer cannot join or bid (AC2)", () => {
      it("refuses join with 403 banned_customer, no participant, no ledger row", async () => {
        const banned = await customer()
        await strike(banned.id)
        await strike(banned.id)
        const event = await auction()
        const seeded = await lot(event.id)
        const ledgerBefore = await wallets().listWalletTransactions()

        const res = await failure(join(seeded.id, banned.auth))
        expect(res.status).toEqual(403)
        expect(res.data.code).toEqual("banned_customer")
        expect(res.data.message).toEqual(
          "Akun Anda diblokir karena memiliki 2 strike aktif."
        )

        expect(
          await auctions().listLotParticipants({ lot_id: seeded.id })
        ).toHaveLength(0)
        expect(await joinFeeRows(banned.walletId)).toHaveLength(0)
        expect(await wallets().listWalletTransactions()).toHaveLength(
          ledgerBefore.length
        )
      })

      it("refuses a bid with 403 banned_customer, no bid row, price unchanged", async () => {
        const banned = await customer()
        await strike(banned.id)
        await strike(banned.id)
        const event = await auction()
        const seeded = await lot(event.id)
        await auctions().createAuctionParticipants([
          { auction_id: event.id, customer_id: banned.id },
        ])

        const res = await failure(bid(banned.auth, seeded.id))
        expect(res.status).toEqual(403)
        expect(res.data.code).toEqual("banned_customer")
        expect(res.data.message).toEqual(
          "Akun Anda diblokir karena memiliki 2 strike aktif."
        )
        expect(await auctions().listBids({ lot_id: seeded.id })).toHaveLength(0)
        expect((await auctions().retrieveLot(seeded.id)).current_price).toEqual(
          1_000_000
        )
      })
    })

    describe("1 active strike, one removed, one expired: no ban (AC2)", () => {
      const both = async () => {
        const buyer = await customer(250_000)
        const event = await auction()
        const seeded = await lot(event.id)
        return { buyer, event, seeded }
      }

      it("1 active strike joins and bids", async () => {
        const { buyer, event, seeded } = await both()
        await strike(buyer.id)

        expect((await join(seeded.id, buyer.auth)).status).toEqual(201)
        expect(await joinFeeRows(buyer.walletId)).toHaveLength(1)
        expect((await bid(buyer.auth, seeded.id)).status).toEqual(201)
        expect(await auctions().listBids({ lot_id: seeded.id })).toHaveLength(1)
      })

      it("2 strikes with one removed join and bid", async () => {
        const { buyer, event, seeded } = await both()
        const removed = await strike(buyer.id)
        await strike(buyer.id)
        await moderation().updateStrikes([
          {
            id: removed.id,
            removed_at: new Date(),
            removed_by: "admin_test",
            removed_reason: "Salah orang.",
          },
        ])

        expect((await join(seeded.id, buyer.auth)).status).toEqual(201)
        expect((await bid(buyer.auth, seeded.id)).status).toEqual(201)
      })

      it("2 strikes with one 181 days old join and bid", async () => {
        const { buyer, event, seeded } = await both()
        const old = await strike(buyer.id)
        await backdate(old.id, 181)
        await strike(buyer.id)

        expect((await join(seeded.id, buyer.auth)).status).toEqual(201)
        expect((await bid(buyer.auth, seeded.id)).status).toEqual(201)
      })
    })

    describe("a banned farmer cannot create an auction (AC2)", () => {
      it("refuses with 403 banned_seller, no auction and no product", async () => {
        const farm = await registerFarm()
        await strike(farm.customer.id)
        await strike(farm.customer.id)
        const feeCategory = await category("ban")
        const productsBefore = await getContainer()
          .resolve(Modules.PRODUCT)
          .listProducts({})

        const res = await failure(
          createAuction(farm.vendor, auctionBody(feeCategory.id))
        )
        expect(res.status).toEqual(403)
        expect(res.data.code).toEqual("banned_seller")
        expect(res.data.message).toEqual(
          "Akun Anda diblokir karena memiliki 2 strike aktif."
        )

        expect(
          await auctions().listAuctions({ seller_id: farm.seller.id })
        ).toHaveLength(0)
        expect(
          await getContainer().resolve(Modules.PRODUCT).listProducts({})
        ).toHaveLength(productsBefore.length)
      })

      it("the same farmer with 1 strike still creates (201)", async () => {
        const farm = await registerFarm()
        await strike(farm.customer.id)
        const feeCategory = await category("one")

        const res = await createAuction(
          farm.vendor,
          auctionBody(feeCategory.id)
        )
        expect(res.status).toEqual(201)
        expect(res.data.auction.status).toEqual("draft")
      })

      it("skips the gate when the member token has no customer_id", async () => {
        const farm = await registerFarm()
        await strike(farm.customer.id)
        await strike(farm.customer.id)
        const feeCategory = await category("noprofile")
        const headers = {
          authorization: `Bearer ${jwt(
            getContainer(),
            farm.memberId,
            "member"
          )}`,
          "x-seller-id": farm.seller.id,
        }

        const res = await createAuction(headers, auctionBody(feeCategory.id))
        expect(res.status).toEqual(201)
      })

      it("a suspended (not banned) farmer is still refused by validateSellerOpenStep", async () => {
        const farm = await registerFarm()
        await suspendSellerWorkflow(getContainer()).run({
          input: { seller_id: farm.seller.id, reason: "qa suspend" },
        })
        const feeCategory = await category("suspend")

        const res = await failure(
          createAuction(farm.vendor, auctionBody(feeCategory.id))
        )
        expect(res.status).toEqual(403)
        expect(res.data.message).toEqual(
          "Kebun Anda belum disetujui, jadi area petani belum terbuka."
        )
        expect(
          await auctions().listAuctions({ seller_id: farm.seller.id })
        ).toHaveLength(0)
      })
    })

    describe("the ban does not reach the other farmer actions (D-054, D-060)", () => {
      it("a banned farmer still ships a paid lot and accepts a claim", async () => {
        const farm = await registerFarm()
        await strike(farm.customer.id)
        await strike(farm.customer.id)
        const [winner] = await getContainer()
          .resolve(Modules.CUSTOMER)
          .createCustomers([{ email: `ban-winner-${Date.now()}@test.dev` }])
        const sold = await auction({
          seller_id: farm.seller.id,
          status: "closed",
          start_at: new Date(Date.now() - 2 * DAY),
          end_at: new Date(Date.now() - DAY),
        })
        const paidLot = await lot(sold.id, {
          product_id: "prod_ban_paid",
          // US-108 (D-068): an admin confirms payment, so the lot starts paid.
          status: "paid",
          winner_customer_id: winner.id,
          final_price: 1_500_000,
          closed_at: new Date(Date.now() - HOUR),
          end_time: new Date(Date.now() - 60_000),
        })
        const claimLot = await lot(sold.id, {
          product_id: "prod_ban_claim",
          status: "delivered",
          winner_customer_id: winner.id,
          final_price: 1_500_000,
          closed_at: new Date(Date.now() - 2 * DAY),
          end_time: new Date(Date.now() - DAY),
        })
        const [claim] = await moderation().createClaims([
          {
            lot_id: claimLot.id,
            customer_id: winner.id,
            seller_id: farm.seller.id,
            remedy: "refund",
            video_file_key: "private-strikes-ban.mp4",
          },
        ])
        const ledgerBefore = await wallets().listWalletTransactions()
        const walletRowsBefore = await wallets().listWallets()

        const shipped = await api.post(
          `/vendor/sold-lots/${paidLot.id}/shipped`,
          {},
          { headers: farm.vendor }
        )
        expect(shipped.status).toEqual(200)
        expect(shipped.data.lot).toMatchObject({ status: "shipped" })

        const accepted = await api.post(
          `/vendor/claims/${claim.id}/accept`,
          null,
          { headers: farm.vendor }
        )
        expect(accepted.status).toEqual(200)
        expect(accepted.data.claim).toMatchObject({ status: "approved" })

        // Shipping and the claim accept move no money row anywhere.
        expect(await wallets().listWalletTransactions()).toHaveLength(
          ledgerBefore.length
        )
        expect(await wallets().listWallets()).toHaveLength(
          walletRowsBefore.length
        )
      })
    })
  },
})
