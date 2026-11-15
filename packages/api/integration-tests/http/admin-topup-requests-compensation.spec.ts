import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { WALLET_MODULE } from "../../src/modules/wallet"
import type WalletModuleService from "../../src/modules/wallet/service"
import { decideTopupRequestWorkflow } from "../../src/workflows/decide-topup-request"

jest.setTimeout(60 * 1000)

// US-012 AC3 (qa): forces the credit step to fail *after* the request has
// already been flipped to "approved" and the lock released, to prove the
// decision compensates back to "pending" and leaves no ledger row, so a retry
// can credit exactly once instead of silently losing the top-up or doubling it.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    describe("decide-topup-request workflow compensation (US-012 AC3)", () => {
      let container: MedusaContainer
      let walletService: WalletModuleService
      let adminId: string
      let walletId: string
      let requestId: string

      beforeEach(async () => {
        container = getContainer()
        walletService = container.resolve<WalletModuleService>(WALLET_MODULE)

        const [user] = await container
          .resolve(Modules.USER)
          .createUsers([{ email: `comp-admin-${Date.now()}@test.dev` }])
        adminId = user.id

        const [wallet] = await walletService.createWallets([{}])
        walletId = wallet.id

        const [request] = await walletService.createTopupRequests([
          { wallet_id: walletId, amount: 75_000, screenshot_file_key: "private-c.png" },
        ])
        requestId = request.id
      })

      it("reverts the request to pending (no ledger row) when the credit step throws, and a retry credits exactly once", async () => {
        const spy = jest
          .spyOn(walletService, "createWalletTransactions")
          .mockRejectedValueOnce(new Error("simulated credit failure"))

        let thrown: unknown
        try {
          await decideTopupRequestWorkflow(container).run({
            input: {
              id: requestId,
              action: "approve",
              admin_id: adminId,
              bank_reference: "BCA-FAIL-1",
            },
          })
        } catch (e) {
          thrown = e
        }
        expect((thrown as Error)?.message).toContain("simulated credit failure")

        // Compensation ran: the decision is undone, not stuck "approved" with no credit.
        const [afterFailure] = await walletService.listTopupRequests({ id: requestId })
        expect(afterFailure.status).toEqual("pending")
        expect(afterFailure.reviewed_by).toBeNull()
        expect(afterFailure.decided_at).toBeNull()
        expect(await walletService.listWalletTransactions({ wallet_id: walletId })).toHaveLength(0)

        spy.mockRestore()

        // Retrying the same request now succeeds and credits exactly once.
        const { result } = await decideTopupRequestWorkflow(container).run({
          input: {
            id: requestId,
            action: "approve",
            admin_id: adminId,
            bank_reference: "BCA-RETRY-1",
          },
        })
        expect(result.wallet_transaction).toMatchObject({
          type: "manual_topup",
          amount: 75_000,
          reference: "BCA-RETRY-1",
        })

        const transactions = await walletService.listWalletTransactions({ wallet_id: walletId })
        expect(transactions).toHaveLength(1)
        expect(transactions[0]).toMatchObject({ amount: 75_000, reference: "BCA-RETRY-1" })

        const query = container.resolve(ContainerRegistrationKeys.QUERY)
        const {
          data: [row],
        } = await query.graph({
          entity: "topup_request",
          fields: ["id", "status"],
          filters: { id: requestId },
        })
        expect(row.status).toEqual("approved")
      })
    })
  },
})
