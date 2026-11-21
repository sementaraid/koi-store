import fs from "fs/promises"
import path from "path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import deleteOrphanKtp from "../../src/jobs/delete-orphan-ktp"
import { ORPHAN_KTP_RETENTION_DAYS } from "../../src/workflows/steps/orphan-ktp"

jest.setTimeout(180 * 1000)

// The batch size is a module constant, not env-driven. Lower it for this test
// only (no app code changed) so a 5-file backlog must be drained over several
// passes by the job's own loop.
jest.mock("../../src/workflows/steps/orphan-ktp", () => ({
  ...jest.requireActual("../../src/workflows/steps/orphan-ktp"),
  ORPHAN_KTP_BATCH_SIZE: 2,
}))

// QA T-093.2: independent proof, not the builder's spec. Fixtures go through
// the real HTTP upload path (`POST /store/farm-uploads`) and claims/top-ups go
// through their own upload workflows, the same filenames the routes produce.

const DAY = 24 * 60 * 60 * 1000
const PRIVATE_DIR = path.join(process.cwd(), "private-uploads")
const PUBLIC_DIR = path.join(process.cwd(), "static")
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

const form = (purpose: string) => {
  const body = new FormData()
  body.append("purpose", purpose)
  body.append("file", new Blob([new Uint8Array(PNG)], { type: "image/png" }), "x.png")
  return body
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>
    const written = new Set<string>()

    beforeAll(async () => {
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      await pg.raw(`
        CREATE TABLE IF NOT EXISTS "seller_custom_fields" (
          "id" varchar(255) not null,
          "seller_id" varchar(255) not null,
          "ktp_photo_key" varchar(255) null,
          "ktp_nik" varchar(255) null,
          "farm_photo_urls" text[] null,
          "created_at" timestamptz not null default CURRENT_TIMESTAMP,
          "updated_at" timestamptz not null default CURRENT_TIMESTAMP,
          "deleted_at" timestamptz null,
          constraint "seller_custom_fields_pkey" primary key ("id")
        )
      `)
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "qa", type: "publishable", created_by: "qa" }])
      headers = { "x-publishable-api-key": key.token }
    })

    afterAll(async () => {
      for (const file of written) await fs.rm(file, { force: true })
    })

    const track = (key: string) => {
      const dir = key.startsWith("private-") ? PRIVATE_DIR : PUBLIC_DIR
      written.add(path.join(dir, key))
      return path.join(dir, key)
    }

    const exists = async (key: string) =>
      !!(await fs.stat(track(key)).catch(() => null))

    const backdate = async (key: string, ageMs: number) => {
      const file = track(key)
      const when = new Date(Date.now() - ageMs)
      await fs.utimes(file, when, when)
    }

    // Real HTTP path: customer sign-up, then POST /store/farm-uploads.
    const customerToken = async () => {
      const email = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const reg = await api.post(
        "/auth/customer/emailpass/register",
        { email, password },
        { headers }
      )
      await api.post(
        "/store/customers",
        { email, phone: "+6281234567890" },
        { headers: { ...headers, authorization: `Bearer ${reg.data.token}` } }
      )
      const signIn = await api.post(
        "/auth/customer/emailpass",
        { email, password },
        { headers }
      )
      return { token: signIn.data.token as string, email, password }
    }

    const upload = async (purpose: "ktp" | "farm") => {
      const { token } = await customerToken()
      const res = await api.post("/store/farm-uploads", form(purpose), {
        headers: { ...headers, authorization: `Bearer ${token}` },
      })
      expect(res.status).toEqual(200)
      return res.data.file_key as string
    }

    it("AC1+T-093.2: real orphan KTP older than retention deleted", async () => {
      const key = await upload("ktp")
      expect(key).toMatch(/^private-\d+-ktp\.png$/)
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)
      expect(await exists(key)).toBe(true)

      await deleteOrphanKtp(getContainer())
      expect(await exists(key)).toBe(false)
    })

    it("AC3+T-093.2: seller-referenced KTP survives however old", async () => {
      const key = await upload("ktp")
      const email = `seller-${Date.now()}@test.dev`
      const password = "Rahasia123!"
      const container = getContainer()
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      await container.resolve(Modules.CUSTOMER).createCustomers([{ email }])
      await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun QA ${Date.now()}`,
            email,
            currency_code: "idr",
          },
          address: { address_1: "Jl. QA 1", city: "Bogor", province: "Jawa Barat" },
          payment_details: {
            holder_name: "QA",
            bank_name: "BCA",
            account_number: "1234567890",
          },
          additional_data: {
            ktp_photo_key: key,
            ktp_nik: "3273012345678901",
            farm_photo_urls: ["http://localhost:9000/static/kebun.png"],
          },
        },
      })
      // DB proof, not just in-memory.
      const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const { rows } = await pg.raw(
        `select ktp_photo_key from seller_custom_fields where ktp_photo_key = ?`,
        [key]
      )
      expect(rows.map((r: { ktp_photo_key: string }) => r.ktp_photo_key)).toEqual([key])

      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 400) * DAY)
      await deleteOrphanKtp(getContainer())
      expect(await exists(key)).toBe(true)
    })

    it("AC3+T-093.2: public farm photo survives (old)", async () => {
      const key = await upload("farm")
      expect(key.startsWith("private-")).toBe(false)
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)
      await deleteOrphanKtp(getContainer())
      expect(await exists(key)).toBe(true)
    })

    it("AC3: claim video and top-up screenshot under private-uploads survive", async () => {
      const container = getContainer()
      const { uploadFilesStep } = require("@medusajs/medusa/core-flows")
      const { createWorkflow, WorkflowResponse } = require("@medusajs/framework/workflows-sdk")
      const raw = createWorkflow(`qa-raw-upload-${Date.now()}`, (input: {
        filename: string
        mimeType: string
        content: string
      }) =>
        new WorkflowResponse(
          uploadFilesStep({
            files: [{ ...input, access: "private" as const }],
          })
        )
      )
      const video = await raw(container).run({
        input: {
          filename: "unboxing.mp4",
          mimeType: "video/mp4",
          content: "ZmFrZQ==",
        },
      })
      const shot = await raw(container).run({
        input: {
          filename: "bukti-transfer.png",
          mimeType: "image/png",
          content: PNG.toString("base64"),
        },
      })
      const videoKey = video.result[0].id as string
      const shotKey = shot.result[0].id as string
      expect(videoKey).toMatch(/^private-\d+-unboxing\.mp4$/)
      expect(shotKey).toMatch(/^private-\d+-bukti-transfer\.png$/)
      await backdate(videoKey, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)
      await backdate(shotKey, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)
      const ktp = await upload("ktp")
      await backdate(ktp, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)

      await deleteOrphanKtp(container)
      expect(await exists(videoKey)).toBe(true)
      expect(await exists(shotKey)).toBe(true)
      expect(await exists(ktp)).toBe(false)
    })

    it("AC1: KTP newer than retention survives; second run deletes 0", async () => {
      const fresh = await upload("ktp")
      await backdate(fresh, (ORPHAN_KTP_RETENTION_DAYS - 2) * DAY)
      const old = await upload("ktp")
      await backdate(old, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)

      await deleteOrphanKtp(getContainer())
      expect(await exists(fresh)).toBe(true)
      expect(await exists(old)).toBe(false)

      // Idempotent: nothing old+orphan is left, so the second pass deletes 0.
      const logger = getContainer().resolve(ContainerRegistrationKeys.LOGGER)
      const info = jest.spyOn(logger, "info")
      await deleteOrphanKtp(getContainer())
      const summary = info.mock.calls
        .map((c) => String(c[0]))
        .find((l) => l.startsWith("delete-orphan-ktp:"))
      info.mockRestore()
      expect(summary).toContain("deleted 0")
      expect(await exists(fresh)).toBe(true)
    })

    it("AC2: backlog of 5 orphans all removed across multiple low-batch passes", async () => {
      const keys: string[] = []
      for (let i = 0; i < 5; i++) keys.push(await upload("ktp"))
      for (const key of keys) await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 2) * DAY)
      const logger = getContainer().resolve(ContainerRegistrationKeys.LOGGER)
      const info = jest.spyOn(logger, "info")
      await deleteOrphanKtp(getContainer())
      const summary = info.mock.calls
        .map((c) => String(c[0]))
        .find((l) => l.startsWith("delete-orphan-ktp:"))
      info.mockRestore()
      expect(summary).toBe("delete-orphan-ktp: deleted 5 in batches of 2")
      for (const key of keys) expect(await exists(key)).toBe(false)
    })

    it("job: `delete-orphan-ktp` loads and registers with cron 0 4 * * *", async () => {
      const { JobLoader } = require("@medusajs/framework/jobs")
      const { WorkflowManager } = require("@medusajs/framework/orchestration")
      const loader = new JobLoader(
        path.join(process.cwd(), "src/jobs"),
        getContainer()
      )
      await loader.load()
      const wf = WorkflowManager.getWorkflow("job-delete-orphan-ktp")
      expect(wf).toBeDefined()
      expect(wf.options.schedule).toMatchObject({ cron: "0 4 * * *" })
    })

    it("config: a positive ORPHAN_KTP_RETENTION_DAYS overrides the 30-day default", () => {
      const { orphanKtpRetentionMs } = require("../../src/workflows/steps/orphan-ktp")
      const saved = process.env.ORPHAN_KTP_RETENTION_DAYS
      process.env.ORPHAN_KTP_RETENTION_DAYS = "7"
      expect(orphanKtpRetentionMs()).toBe(7 * DAY)
      if (saved === undefined) delete process.env.ORPHAN_KTP_RETENTION_DAYS
      else process.env.ORPHAN_KTP_RETENTION_DAYS = saved
    })

    it("config: unset / empty / abc / 0 / -5 fall back to 30 days", async () => {
      const { orphanKtpRetentionMs, ORPHAN_KTP_RETENTION_DAYS } = require("../../src/workflows/steps/orphan-ktp")
      const saved = process.env.ORPHAN_KTP_RETENTION_DAYS
      for (const v of [undefined, "", "abc", "0", "-5"]) {
        if (v === undefined) delete process.env.ORPHAN_KTP_RETENTION_DAYS
        else process.env.ORPHAN_KTP_RETENTION_DAYS = v
        expect(orphanKtpRetentionMs()).toBe(ORPHAN_KTP_RETENTION_DAYS * DAY)
      }
      if (saved === undefined) delete process.env.ORPHAN_KTP_RETENTION_DAYS
      else process.env.ORPHAN_KTP_RETENTION_DAYS = saved
    })
  },
})
