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
import { createFeeCategoriesWorkflow } from "../../src/workflows/fee-categories"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"

jest.setTimeout(120 * 1000)

// US-046 T-046.1 (AC2, D-061): the farmer's and admin's live-link write, the
// URL allow-list, the editable window and the field on the vendor and public
// reads.

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
    let storeHeaders: Record<string, string>

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)

    const registerFarm = async (options: { approve?: boolean } = {}) => {
      const container = getContainer()
      const email = `live-link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      const [customer] = await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([
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
      // The same identity's customer token, for the /admin refusal.
      const customerSignIn = await api.post("/auth/customer/emailpass", { email, password })
      return { seller, customer, vendor, customerToken: customerSignIn.data.token as string }
    }

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

    const auctionBody = (feeCategoryId: string) => ({
      fee_category_id: feeCategoryId,
      start_at: new Date(Date.now() + DAY).toISOString(),
      end_at: new Date(Date.now() + 3 * DAY).toISOString(),
      delivery_method: "courier",
      lots: [
        {
          title: `Kohaku ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: "Maruten bersih.",
          photos: ["http://localhost:9000/static/koi.jpg"],
          ob: 1_000_000,
          kb: 100_000,
        },
      ],
    })

    const createAuction = async (vendor: Record<string, string>, suffix: string) => {
      const category = await createCategory(suffix)
      const created = await api.post("/vendor/auctions", auctionBody(category.id), {
        headers: vendor,
      })
      expect(created.status).toEqual(201)
      return created.data.auction as { id: string; lots: { id: string }[] }
    }

    const storedLink = async (id: string) => {
      const {
        data: [auction],
      } = await getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "auction",
          fields: ["id", "live_stream_url"],
          filters: { id },
        })
      return auction.live_stream_url as string | null
    }

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([
          { title: "test", type: "publishable", created_by: "test" },
        ])
      storeHeaders = { "x-publishable-api-key": key.token }
    })

    let admin: Record<string, string>

    beforeEach(async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `live-link-admin-${Date.now()}@test.dev` }])
      admin = { authorization: `Bearer ${adminJwt(container, user.id)}` }
    })

    const YOUTUBE = "https://youtube.com/watch?v=koi-live"
    const INSTAGRAM = "https://www.instagram.com/live/koi"

    it("sets the link on a scheduled and a live auction and returns it (AC2)", async () => {
      const { seller, vendor } = await registerFarm({ approve: true })
      const scheduled = await createAuction(vendor, "a")
      await auctions().updateAuctions([{ id: scheduled.id, status: "scheduled" }])

      const setScheduled = await api.post(
        `/vendor/auctions/${scheduled.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: vendor }
      )
      expect(setScheduled.status).toEqual(200)
      expect(setScheduled.data.auction).toMatchObject({
        id: scheduled.id,
        seller_id: seller.id,
        live_stream_url: YOUTUBE,
      })
      expect(await storedLink(scheduled.id)).toEqual(YOUTUBE)

      const live = await createAuction(vendor, "b")
      await auctions().updateAuctions([{ id: live.id, status: "live" }])
      const setLive = await api.post(
        `/vendor/auctions/${live.id}/live-link`,
        { live_stream_url: INSTAGRAM },
        { headers: vendor }
      )
      expect(setLive.status).toEqual(200)
      expect(setLive.data.auction.live_stream_url).toEqual(INSTAGRAM)
      expect(await storedLink(live.id)).toEqual(INSTAGRAM)
    })

    it("clears a set link with null (AC2)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "c")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      await api.post(
        `/vendor/auctions/${auction.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: vendor }
      )
      const cleared = await api.post(
        `/vendor/auctions/${auction.id}/live-link`,
        { live_stream_url: null },
        { headers: vendor }
      )
      expect(cleared.status).toEqual(200)
      expect(cleared.data.auction.live_stream_url).toBeNull()
      expect(await storedLink(auction.id)).toBeNull()
    })

    it("refuses a URL outside the allow-list with 400 and saves nothing (AC2)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "d")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      for (const live_stream_url of [
        "http://youtube.com/watch?v=x",
        "https://youtube.com.evil.dev/x",
        "https://tiktok.com/x",
        "https://instagram.com/",
        "  ",
      ]) {
        const refused = await failure(
          api.post(
            `/vendor/auctions/${auction.id}/live-link`,
            { live_stream_url },
            { headers: vendor }
          )
        )
        expect(refused.status).toEqual(400)
        // Medusa prefixes a Zod refusal; the Indonesian sentence survives.
        expect(refused.data.message).toContain(
          "Tautan siaran harus dari YouTube atau Instagram (https)."
        )
        expect(await storedLink(auction.id)).toBeNull()
      }
    })

    it("404s another seller's auction and 409s a closed or cancelled one, value unchanged (D-061)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const other = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "e")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      expect(
        (
          await failure(
            api.post(
              `/vendor/auctions/${auction.id}/live-link`,
              { live_stream_url: YOUTUBE },
              { headers: other.vendor }
            )
          )
        ).status
      ).toEqual(404)
      expect(await storedLink(auction.id)).toBeNull()

      for (const status of ["closed", "cancelled"] as const) {
        await auctions().updateAuctions([{ id: auction.id, status }])
        const refused = await failure(
          api.post(
            `/vendor/auctions/${auction.id}/live-link`,
            { live_stream_url: YOUTUBE },
            { headers: vendor }
          )
        )
        expect(refused.status).toEqual(409)
        expect(await storedLink(auction.id)).toBeNull()
      }
    })

    it("refuses a suspended farm with 403 (D-054)", async () => {
      const container = getContainer()
      const { seller, vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "f")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      await suspendSellerWorkflow(container).run({
        input: { seller_id: seller.id, reason: "qa suspend" },
      })
      expect(
        (
          await failure(
            api.post(
              `/vendor/auctions/${auction.id}/live-link`,
              { live_stream_url: YOUTUBE },
              { headers: vendor }
            )
          )
        ).status
      ).toEqual(403)
      expect(await storedLink(auction.id)).toBeNull()
    })

    it("carries the field on the vendor list and detail (AC2)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "g")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])
      await api.post(
        `/vendor/auctions/${auction.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: vendor }
      )

      const list = await api.get("/vendor/auctions", { headers: vendor })
      expect(list.status).toEqual(200)
      const row = list.data.auctions.find((a: { id: string }) => a.id === auction.id)
      expect(row.live_stream_url).toEqual(YOUTUBE)

      const detail = await api.get(`/vendor/auctions/${auction.id}`, { headers: vendor })
      expect(detail.status).toEqual(200)
      expect(detail.data.auction.live_stream_url).toEqual(YOUTUBE)
    })

    it("refuses a body that carries seller_id (identity from the token only)", async () => {
      const { seller, vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "h")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      expect(
        (
          await failure(
            api.post(
              `/vendor/auctions/${auction.id}/live-link`,
              { live_stream_url: YOUTUBE, seller_id: seller.id },
              { headers: vendor }
            )
          )
        ).status
      ).toEqual(400)
    })

    it("carries auction.live_stream_url on the public lot reads; a draft lot still 404s (D-061)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "i")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])
      await api.post(
        `/vendor/auctions/${auction.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: vendor }
      )
      const lotId = auction.lots[0].id

      const feed = await api.get("/store/lots", { headers: storeHeaders })
      expect(feed.status).toEqual(200)
      const feedLot = feed.data.lots.find((l: { id: string }) => l.id === lotId)
      expect(feedLot.auction.live_stream_url).toEqual(YOUTUBE)
      // Feed rows carry no bids.
      expect(feedLot).not.toHaveProperty("bids")

      const detail = await api.get(`/store/lots/${lotId}`, { headers: storeHeaders })
      expect(detail.status).toEqual(200)
      expect(detail.data.lot.auction.live_stream_url).toEqual(YOUTUBE)

      // A draft auction's lot with a link is still 404.
      const draft = await createAuction(vendor, "j")
      await api.post(
        `/vendor/auctions/${draft.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: vendor }
      )
      expect(
        (
          await failure(
            api.get(`/store/lots/${draft.lots[0].id}`, { headers: storeHeaders })
          )
        ).status
      ).toEqual(404)
    })

    it("lets the admin set and clear the link on any editable auction, even a suspended farm's (D-061)", async () => {
      const container = getContainer()
      const { seller, vendor, customerToken } = await registerFarm({
        approve: true,
      })
      const auction = await createAuction(vendor, "k")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])

      await suspendSellerWorkflow(container).run({
        input: { seller_id: seller.id, reason: "qa suspend" },
      })
      const set = await api.post(
        `/admin/auctions/${auction.id}/live-link`,
        { live_stream_url: INSTAGRAM },
        { headers: admin }
      )
      expect(set.status).toEqual(200)
      expect(set.data.auction).toMatchObject({
        id: auction.id,
        live_stream_url: INSTAGRAM,
      })
      expect(await storedLink(auction.id)).toEqual(INSTAGRAM)

      const cleared = await api.post(
        `/admin/auctions/${auction.id}/live-link`,
        { live_stream_url: null },
        { headers: admin }
      )
      expect(cleared.status).toEqual(200)
      expect(await storedLink(auction.id)).toBeNull()

      // A bad host is 400.
      expect(
        (
          await failure(
            api.post(
              `/admin/auctions/${auction.id}/live-link`,
              { live_stream_url: "https://tiktok.com/x" },
              { headers: admin }
            )
          )
        ).status
      ).toEqual(400)

      // Closed is 409.
      await auctions().updateAuctions([{ id: auction.id, status: "closed" }])
      expect(
        (
          await failure(
            api.post(
              `/admin/auctions/${auction.id}/live-link`,
              { live_stream_url: INSTAGRAM },
              { headers: admin }
            )
          )
        ).status
      ).toEqual(409)

      // Not an admin (customer or member token) is refused.
      for (const headers of [
        { authorization: `Bearer ${customerToken}` },
        { authorization: vendor.authorization },
      ]) {
        const refused = await failure(
          api.post(`/admin/auctions/${auction.id}/live-link`, { live_stream_url: null }, { headers })
        )
        expect([401, 403]).toContain(refused.status)
      }
    })

    it("carries the field on the admin queue read (D-061)", async () => {
      const { vendor } = await registerFarm({ approve: true })
      const auction = await createAuction(vendor, "l")
      await auctions().updateAuctions([{ id: auction.id, status: "scheduled" }])
      await api.post(
        `/admin/auctions/${auction.id}/live-link`,
        { live_stream_url: YOUTUBE },
        { headers: admin }
      )
      // The queue reads pending_approval; move it there after the write.
      await auctions().updateAuctions([{ id: auction.id, status: "pending_approval" }])

      const queue = await api.get("/admin/auctions?limit=100", { headers: admin })
      expect(queue.status).toEqual(200)
      const row = queue.data.auctions.find((a: { id: string }) => a.id === auction.id)
      expect(row.live_stream_url).toEqual(YOUTUBE)
    })
  },
})
