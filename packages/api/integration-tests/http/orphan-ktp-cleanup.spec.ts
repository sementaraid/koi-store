import fs from "fs/promises"
import path from "path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"
import { uploadFarmFileWorkflow } from "../../src/workflows/upload-farm-file"
import {
  ORPHAN_KTP_BATCH_SIZE,
  ORPHAN_KTP_RETENTION_DAYS,
} from "../../src/workflows/steps/orphan-ktp"
import deleteOrphanKtp from "../../src/jobs/delete-orphan-ktp"

jest.setTimeout(120 * 1000)

// US-093 T-093.1 (AC1–AC3, D-017): the daily job deletes private `ktp` uploads
// that no seller references and that are older than the retention window. A
// referenced KTP, a public farm photo, another private upload and a fresh KTP
// are never touched; a second run deletes nothing; a large backlog is worked
// off in batches of 100.

const DAY = 24 * 60 * 60 * 1000
// real private files live next to the app, as medusa-config.ts sets them.
const PRIVATE_DIR = path.join(process.cwd(), "private-uploads")
const PUBLIC_DIR = path.join(process.cwd(), "static")

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const fileModule = () => getContainer().resolve(Modules.FILE)

    // Files this spec writes into the app's real private dir; removed after.
    const written = new Set<string>()

    const exists = async (key: string) => {
      try {
        await fileModule().getAsBuffer(key)
        return true
      } catch {
        return false
      }
    }

    const upload = async (
      filename: string,
      access: "public" | "private" = "private"
    ) => {
      const { result } = await uploadFarmFileWorkflow(getContainer()).run({
        input: { filename, mimeType: "image/png", content: PNG_BASE64, access },
      })
      const key = result[0].id as string
      written.add(path.join(key.startsWith("private-") ? PRIVATE_DIR : PUBLIC_DIR, key))
      return key
    }

    afterAll(async () => {
      for (const file of written) {
        await fs.rm(path.join(process.cwd(), file), { force: true })
      }
    })

    // The local provider writes private files here and public ones under
    // static/; backdate one so the age check sees it as old.
    const backdate = async (key: string, ageMs: number) => {
      const dir = key.startsWith("private-") ? PRIVATE_DIR : PUBLIC_DIR
      const file = path.join(dir, key)
      const when = new Date(Date.now() - ageMs)
      await fs.utimes(file, when, when)
    }

    // Same side table as admin-farms.spec.ts: migrationOnly mode skips the
    // Custom Fields loader that creates it on `medusa db:migrate`.
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
    })

    // A farm whose KTP photo is a real private upload, as US-020 leaves one.
    const registerFarm = async (ktpKey: string) => {
      const container = getContainer()
      const email = `orphan-ktp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.dev`
      const password = "Rahasia123!"
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity } = await auth.register("emailpass", {
        body: { email, password },
      })
      await container
        .resolve(Modules.CUSTOMER)
        .createCustomers([{ email }])
      const { result: seller } = await createSellerAccountWorkflow(
        container
      ).run({
        input: {
          auth_identity_id: authIdentity!.id,
          member_email: email,
          seller: {
            name: `Kebun ${Date.now()}`,
            email,
            currency_code: "idr",
          },
          address: {
            address_1: "Jl. Raya Bogor 1",
            city: "Bogor",
            province: "Jawa Barat",
          },
          payment_details: {
            holder_name: "Budi Santoso",
            bank_name: "BCA",
            account_number: "1234567890",
          },
          additional_data: {
            ktp_photo_key: ktpKey,
            ktp_nik: "3273012345678901",
            farm_photo_urls: ["http://localhost:9000/static/kebun.png"],
          },
        },
      })
      return seller
    }

    it("deletes an orphan KTP older than the window (AC1)", async () => {
      const key = await upload("ktp.png")
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 1) * DAY)
      expect(await exists(key)).toBe(true)

      await deleteOrphanKtp(getContainer())

      expect(await exists(key)).toBe(false)
    })

    it("never deletes a KTP attached to a seller, however old (AC3)", async () => {
      const key = await upload("ktp.png")
      await registerFarm(key)
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 30) * DAY)

      await deleteOrphanKtp(getContainer())

      expect(await exists(key)).toBe(true)
    })

    it("never deletes a public farm photo or another private upload (AC3)", async () => {
      const farmPhoto = await upload("kebun.png", "public")
      const screenshot = await upload("bukti-transfer.png", "private")
      expect(farmPhoto.startsWith("private-")).toBe(false)
      await backdate(farmPhoto, (ORPHAN_KTP_RETENTION_DAYS + 1) * DAY)
      await backdate(screenshot, (ORPHAN_KTP_RETENTION_DAYS + 1) * DAY)

      await deleteOrphanKtp(getContainer())

      expect(await exists(farmPhoto)).toBe(true)
      expect(await exists(screenshot)).toBe(true)
    })

    it("leaves a KTP newer than the window untouched (AC1)", async () => {
      const key = await upload("ktp.png")
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS - 1) * DAY)

      await deleteOrphanKtp(getContainer())

      expect(await exists(key)).toBe(true)
    })

    it("deletes nothing on a second run (AC2)", async () => {
      const key = await upload("ktp.png")
      await backdate(key, (ORPHAN_KTP_RETENTION_DAYS + 1) * DAY)
      const logger = getContainer().resolve(ContainerRegistrationKeys.LOGGER)
      const info = jest.spyOn(logger, "info")

      await deleteOrphanKtp(getContainer())
      expect(await exists(key)).toBe(false)
      info.mockClear()

      await deleteOrphanKtp(getContainer())
      expect(await exists(key)).toBe(false)
      const summary = info.mock.calls
        .map((call) => String(call[0]))
        .find((line) => line.startsWith("delete-orphan-ktp:"))
      expect(summary).toEqual("delete-orphan-ktp: deleted 0 in batches of 100")
      info.mockRestore()
    })

    it(`works a backlog off in batches of ${ORPHAN_KTP_BATCH_SIZE} (AC2)`, async () => {
      // Written straight into the private dir: the File Module has no list
      // by prefix, so the job enumerates the directory the provider owns.
      const names = Array.from(
        { length: ORPHAN_KTP_BATCH_SIZE + 1 },
        (_, i) => `private-${Date.now()}${i}-ktp.png`
      )
      const when = new Date(Date.now() - (ORPHAN_KTP_RETENTION_DAYS + 1) * DAY)
      for (const name of names) {
        const file = path.join(PRIVATE_DIR, name)
        written.add(file)
        await fs.writeFile(file, PNG_BASE64, "base64")
        await fs.utimes(file, when, when)
      }

      await deleteOrphanKtp(getContainer())

      const left = await Promise.all(names.map((name) => exists(name)))
      expect(left).toEqual(names.map(() => false))
    })
  },
})
