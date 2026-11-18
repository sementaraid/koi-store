import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import {
  suspendSellerWorkflow,
  terminateSellerWorkflow,
} from "@mercurjs/core/workflows"
import confirmClaims from "../../src/jobs/confirm-claims"
import { MODERATION_MODULE } from "../../src/modules/moderation"
import type ModerationModuleService from "../../src/modules/moderation/service"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { CLAIM_CONFIRM_WINDOW_MS } from "../../src/workflows/steps/claim"

jest.setTimeout(120 * 1000)

// US-056 T-056.1b (AC4, D-027, D-058): the hourly confirm-claims job moves a
// `resolved` claim older than the 3-day window to `confirmed`, leaves one
// inside the window and every other status alone, is idempotent, keeps going
// when one row fails, writes no ledger row, and confirms even a terminated
// farm's claim (the job is not a farmer action).

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const moderation = () =>
      getContainer().resolve<ModerationModuleService>(MODERATION_MODULE)
    const wallets = () =>
      getContainer().resolve<WalletModuleService>(WALLET_MODULE)

    // Seeded directly: lot/customer/seller are soft references (CLAUDE.md §9),
    // so a claim needs no auction and no lot row. `resolvedAgoMs` sets the
    // deadline clock; negative means still in the future.
    const seedClaim = async (options: {
      status?: string
      resolvedAgoMs?: number
      sellerId?: string
    }) => {
      const [row] = await moderation().createClaims([
        {
          lot_id: `lot_${Math.random().toString(36).slice(2, 10)}`,
          customer_id: "cus_job_winner",
          seller_id: options.sellerId ?? "sel_job_farm",
          remedy: "refund",
          status: (options.status ?? "resolved") as never,
          video_file_key: "file_job_video",
          resolved_at:
            options.resolvedAgoMs === undefined
              ? new Date(Date.now() - CLAIM_CONFIRM_WINDOW_MS - HOUR)
              : new Date(Date.now() - options.resolvedAgoMs),
        },
      ])
      return row
    }

    type StoredClaim = {
      status: string
      resolved_at: string | Date | null
      confirmed_at: string | Date | null
    }

    const claimById = async (id: string) =>
      getContainer()
        .resolve(ContainerRegistrationKeys.QUERY)
        .graph({
          entity: "claim",
          fields: ["id", "status", "resolved_at", "confirmed_at"],
          filters: { id },
        })
        .then(({ data }) => data[0] as StoredClaim)

    it("confirms a claim past the 3-day window and skips one inside it, exactly once", async () => {
      const old = await seedClaim({ resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + HOUR })
      const young = await seedClaim({ resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS - HOUR })

      const before = Date.now()
      await confirmClaims(getContainer())

      const confirmed = await claimById(old.id)
      expect(confirmed.status).toBe("confirmed")
      expect(new Date(confirmed.confirmed_at as string).getTime()).toBeGreaterThanOrEqual(
        before
      )

      const untouched = await claimById(young.id)
      expect(untouched.status).toBe("resolved")
      expect(untouched.confirmed_at).toBeNull()

      // Second run finds nothing and leaves the same confirmed_at.
      const firstConfirmedAt = confirmed.confirmed_at
      await confirmClaims(getContainer())
      const second = await claimById(old.id)
      expect(second.status).toBe("confirmed")
      expect(new Date(second.confirmed_at as string).getTime()).toBe(
        new Date(firstConfirmedAt as string).getTime()
      )
      expect((await claimById(young.id)).status).toBe("resolved")
    })

    it("leaves a resolved claim whose resolved_at is in the future alone", async () => {
      const future = await seedClaim({ resolvedAgoMs: -HOUR })

      await confirmClaims(getContainer())

      const after = await claimById(future.id)
      expect(after.status).toBe("resolved")
      expect(after.confirmed_at).toBeNull()
    })

    it("leaves approved, rejected, open and disputed claims alone", async () => {
      const seeded: Awaited<ReturnType<typeof seedClaim>>[] = []
      for (const status of ["approved", "rejected", "open", "disputed"]) {
        seeded.push(
          await seedClaim({
            status,
            resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + DAY,
          })
        )
      }

      await confirmClaims(getContainer())

      for (const row of seeded) {
        const after = await claimById(row.id)
        expect(after.status).toBe(row.status)
        expect(after.confirmed_at).toBeNull()
      }
    })

    it("logs one failed row and still confirms the rest of the batch", async () => {
      const first = await seedClaim({ resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + HOUR })
      const second = await seedClaim({ resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + HOUR })

      // One failure inside the workflow (the update step), as
      // farmer-auctions.spec.ts forces one. Which of the two ids is processed
      // first is the job's ASC order, so assert by outcome count.
      const spy = jest
        .spyOn(moderation(), "updateClaims")
        .mockRejectedValueOnce(new Error("qa: simulated update failure"))

      await expect(confirmClaims(getContainer())).resolves.toBeUndefined()

      spy.mockRestore()

      const after = await Promise.all([claimById(first.id), claimById(second.id)])
      expect(after.filter((c) => c.status === "confirmed")).toHaveLength(1)
      expect(after.filter((c) => c.status === "resolved")).toHaveLength(1)

      // A later run confirms the row the failure left behind.
      await confirmClaims(getContainer())
      const settled = await Promise.all([claimById(first.id), claimById(second.id)])
      expect(settled.every((c) => c.status === "confirmed")).toBe(true)
    })

    it("writes no wallet_transaction row (D-058)", async () => {
      const claim = await seedClaim({
        resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + HOUR,
      })
      const [wallet] = await wallets().createWallets([{}])
      await wallets().createWalletTransactions([
        { wallet_id: wallet.id, type: "manual_topup", amount: 100_000 },
      ])
      const pg = getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)
      const totals = async () => {
        const rows = (await pg.raw(
          `SELECT count(*)::int AS n, coalesce(sum(amount), 0) AS total FROM wallet_transaction`
        )) as { rows: { n: number; total: string }[] }
        return rows.rows[0]
      }
      const before = await totals()

      await confirmClaims(getContainer())

      expect((await claimById(claim.id)).status).toBe("confirmed")
      const after = await totals()
      expect(after.n).toEqual(before.n)
      expect(Number(after.total)).toEqual(Number(before.total))
    })

    it("confirms a terminated farm's claim (the job is not a farmer action)", async () => {
      const sellerModule = getContainer().resolve<{
        createSellers: (
          data: Record<string, unknown>[]
        ) => Promise<{ id: string }[]>
      }>(MercurModules.SELLER)
      const email = `claim-job-farm-${Date.now()}@test.dev`
      const [seller] = await sellerModule.createSellers([
        { name: `Kebun ${email}`, email, currency_code: "idr" },
      ])
      // Mercur refuses to terminate an open farm: suspend first.
      await suspendSellerWorkflow(getContainer()).run({
        input: { seller_id: seller.id, reason: "qa suspend" },
      })
      await terminateSellerWorkflow(getContainer()).run({
        input: { seller_id: seller.id, reason: "qa terminate" },
      })
      const claim = await seedClaim({
        sellerId: seller.id,
        resolvedAgoMs: CLAIM_CONFIRM_WINDOW_MS + HOUR,
      })

      await confirmClaims(getContainer())

      expect((await claimById(claim.id)).status).toBe("confirmed")
    })
  },
})
