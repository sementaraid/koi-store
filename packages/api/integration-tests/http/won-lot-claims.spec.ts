import fs from "fs"
import path from "path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { AUCTION_MODULE } from "../../src/modules/auction"
import type AuctionModuleService from "../../src/modules/auction/service"
import type { LotStatus } from "../../src/modules/auction/models/lot"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { PLATFORM_SETTINGS_MODULE } from "../../src/modules/platform-settings"
import type PlatformSettingsModuleService from "../../src/modules/platform-settings/service"
import { openClaimWorkflow } from "../../src/workflows/open-claim"

jest.setTimeout(120 * 1000)

// US-054 T-054.1a (AC1, AC2, AC4, D-018, D-055, mvp-Q44 a): the winner opens
// one dead-on-arrival claim on a delivered lot, inside the claim window
// (claim_window_hours, default 4), with an unboxing video and a remedy.
// Another customer is 404; every rule is a 409/400 and writes no row or file.

const HOUR = 60 * 60 * 1000
const MB = 1024 * 1024

// A tiny non-empty "video"; the provider only stores bytes.
const VIDEO = Buffer.from("fake-mp4-bytes-for-the-unboxing-claim")

type HttpError = { response: { status: number } }
const statusOf = (p: Promise<unknown>) =>
  p.then(
    () => 200,
    (e: HttpError) => e.response.status
  )

const jwt = (container: MedusaContainer, actor_id: string) => {
  const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig
  return generateJwtToken(
    {
      actor_id,
      actor_type: "customer",
      auth_identity_id: "",
      app_metadata: {},
      user_metadata: {},
    },
    { secret: http.jwtSecret, expiresIn: "1h" }
  )
}

// multipart/form-data, the shape the storefront sends.
const form = (fields: {
  remedy?: string
  file?: { data: Buffer; type: string; name: string }
}) => {
  const body = new FormData()
  if (fields.remedy !== undefined) {
    body.append("remedy", fields.remedy)
  }
  if (fields.file) {
    body.append(
      "video",
      new Blob([new Uint8Array(fields.file.data)], { type: fields.file.type }),
      fields.file.name
    )
  }
  return body
}

const mp4 = { data: VIDEO, type: "video/mp4", name: "unboxing.mp4" }

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishable: string

    const auctions = () =>
      getContainer().resolve<AuctionModuleService>(AUCTION_MODULE)
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const settings = () =>
      getContainer().resolve<PlatformSettingsModuleService>(
        PLATFORM_SETTINGS_MODULE
      )

    const customer = async () => {
      const container = getContainer()
      const [row] = await container.resolve(Modules.CUSTOMER).createCustomers([
        {
          email: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.dev`,
        },
      ])
      return {
        id: row.id,
        headers: {
          authorization: `Bearer ${jwt(container, row.id)}`,
          "x-publishable-api-key": publishable,
        },
      }
    }

    // A closed auction with one lot in the given status, won by `winner`.
    // T-054.1 readiness: the paid/delivered routes are parked, so the spec
    // seeds through the module service.
    const wonLot = async (
      status: LotStatus,
      winnerId: string,
      deliveredAgoMs: number | null = null
    ) => {
      const [event] = await auctions().createAuctions([
        {
          seller_id: "sel_claim",
          fee_category_id: "feecat_claim",
          start_at: new Date(Date.now() - 2 * 24 * HOUR),
          end_at: new Date(Date.now() - 24 * HOUR),
          delivery_method: "courier",
          listing_fee: 0,
          join_fee: 0,
          extend_window_minutes: 5,
          status: "closed",
        },
      ])
      const [row] = await auctions().createLots([
        {
          auction_id: event.id,
          product_id: "prod_claim_test",
          ob: 1_000_000,
          kb: 100_000,
          current_price: 1_500_000,
          end_time: new Date(Date.now() - 60_000),
          status,
          winner_customer_id: winnerId,
          final_price: 1_500_000,
          closed_at: new Date(),
          delivered_at:
            deliveredAgoMs === null ? null : new Date(Date.now() - deliveredAgoMs),
        },
      ])
      return row.id
    }

    const postClaim = (
      headers: Record<string, string>,
      lotId: string,
      body: FormData
    ) => api.post(`/store/won-lots/${lotId}/claims`, body, { headers })

    beforeEach(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      publishable = key.token
    })

    it("opens an open claim and stores one private video (AC1, AC2, AC4)", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)
      const before = Date.now()

      const res = await postClaim(
        winner.headers,
        lotId,
        form({ remedy: "refund", file: mp4 })
      )
      expect(res.status).toEqual(201)
      expect(res.data.claim).toEqual({
        id: expect.stringMatching(/^claim_/),
        lot_id: lotId,
        status: "open",
        remedy: "refund",
        opened_at: expect.any(String),
      })
      expect(new Date(res.data.claim.opened_at).getTime()).toBeGreaterThanOrEqual(
        before - 1000
      )
      // D-018: never the key or a URL.
      expect(JSON.stringify(res.data)).not.toContain("private-")

      const rows = await moderation().listClaims({ lot_id: lotId })
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        customer_id: winner.id,
        seller_id: "sel_claim",
        status: "open",
        remedy: "refund",
      })
      expect(rows[0].video_file_key).toMatch(/^private-.*unboxing\.mp4$/)

      // The private bytes are readable through the File Module, outside static/.
      const bytes = await getContainer()
        .resolve(Modules.FILE)
        .getAsBuffer(rows[0].video_file_key)
      expect(Buffer.from(bytes).equals(VIDEO)).toBe(true)
    })

    it("refuses a claim past the 4-hour default window and writes nothing (AC1)", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, 5 * HOUR)

      const status = await statusOf(
        postClaim(winner.headers, lotId, form({ remedy: "refund", file: mp4 }))
      )
      expect(status).toEqual(409)
      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
    })

    it("reads the window from the settings table (D-010)", async () => {
      const [row] = await settings().createPlatformSettings([
        { claim_window_hours: 8 },
      ])
      try {
        const winner = await customer()
        // Same 5-hour-old lot: refused by the 4 h default, allowed by 8 h.
        const lotId = await wonLot("delivered", winner.id, 5 * HOUR)
        const res = await postClaim(
          winner.headers,
          lotId,
          form({ remedy: "replacement", file: mp4 })
        )
        expect(res.status).toEqual(201)
        expect(res.data.claim.remedy).toEqual("replacement")
      } finally {
        await settings().deletePlatformSettings([row.id])
      }
    })

    it("404s another customer and 401s an anonymous caller (AC1)", async () => {
      const winner = await customer()
      const other = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)

      expect(
        await statusOf(
          postClaim(other.headers, lotId, form({ remedy: "refund", file: mp4 }))
        )
      ).toEqual(404)
      expect(
        await statusOf(
          postClaim(
            { "x-publishable-api-key": publishable },
            lotId,
            form({ remedy: "refund", file: mp4 })
          )
        )
      ).toEqual(401)
      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
    })

    it("refuses lots that are not delivered with 409 (AC1)", async () => {
      const winner = await customer()
      for (const status of ["won", "paid", "shipped"] as const) {
        const lotId = await wonLot(status, winner.id)
        expect(
          await statusOf(
            postClaim(winner.headers, lotId, form({ remedy: "refund", file: mp4 }))
          )
        ).toEqual(409)
        expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
      }
    })

    it("rejects a zero-byte video with 400 and writes no row or file (QA fix)", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)
      const uploadDir = path.join(process.cwd(), "private-uploads")
      const listing = () =>
        fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir).sort() : []
      const before = listing()

      const status = await statusOf(
        postClaim(
          winner.headers,
          lotId,
          form({
            remedy: "refund",
            file: { data: Buffer.alloc(0), type: "video/mp4", name: "empty.mp4" },
          })
        )
      )

      expect(status).toEqual(400)
      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
      expect(listing()).toEqual(before)
    })

    it("rejects an invalid remedy, a missing file, a 101 MB file and an image", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)
      const attempt = (body: FormData) =>
        statusOf(postClaim(winner.headers, lotId, body))

      expect(await attempt(form({ remedy: "cash", file: mp4 }))).toEqual(400)
      expect(await attempt(form({ remedy: "refund" }))).toEqual(400)
      expect(
        await attempt(
          form({
            remedy: "refund",
            file: { data: Buffer.alloc(101 * MB), type: "video/mp4", name: "big.mp4" },
          })
        )
      ).toEqual(400)
      expect(
        await attempt(
          form({
            remedy: "refund",
            file: { data: VIDEO, type: "image/jpeg", name: "foto.jpg" },
          })
        )
      ).toEqual(400)

      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
    })

    it("refuses a second claim on the same lot with 409 (mvp-Q44 a)", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)

      const first = await postClaim(
        winner.headers,
        lotId,
        form({ remedy: "refund", file: mp4 })
      )
      expect(first.status).toEqual(201)

      expect(
        await statusOf(
          postClaim(
            winner.headers,
            lotId,
            form({ remedy: "replacement", file: mp4 })
          )
        )
      ).toEqual(409)
      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(1)
    })

    it("deletes the uploaded video when the claim insert fails (compensation)", async () => {
      const winner = await customer()
      const lotId = await wonLot("delivered", winner.id, HOUR)

      const fileModule = getContainer().resolve(Modules.FILE)
      let uploadedKey: string | undefined
      const createFiles = fileModule.createFiles.bind(fileModule)
      const createFilesSpy = jest
        .spyOn(fileModule, "createFiles")
        .mockImplementationOnce(async (data: unknown) => {
          const created = await createFiles(data as never)
          uploadedKey = created[0].id
          // uploadFilesStep maps the result, so keep the array shape.
          return created as never
        })
      const claimSpy = jest
        .spyOn(moderation(), "createClaims")
        .mockRejectedValueOnce(new Error("qa: simulated insert failure"))

      const run = await openClaimWorkflow(getContainer()).run({
        input: {
          customer_id: winner.id,
          lot_id: lotId,
          remedy: "refund",
          video: {
            filename: "unboxing.mp4",
            mimeType: "video/mp4",
            content: VIDEO.toString("base64"),
          },
        },
        throwOnError: false,
      })
      expect(run.errors?.length).toBeGreaterThan(0)

      expect(await moderation().listClaims({ lot_id: lotId })).toHaveLength(0)
      expect(uploadedKey).toMatch(/^private-/)
      await expect(fileModule.getAsBuffer(uploadedKey!)).rejects.toThrow()

      createFilesSpy.mockRestore()
      claimSpy.mockRestore()
    })
  },
})
