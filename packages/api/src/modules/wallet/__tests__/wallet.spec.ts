import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { WALLET_MODULE } from ".."
import WalletModuleService from "../service"
import { TopupRequest } from "../models/topup-request"
import { Wallet } from "../models/wallet"
import { WalletTransaction } from "../models/wallet-transaction"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner<WalletModuleService>({
  moduleName: WALLET_MODULE,
  moduleModels: [Wallet, WalletTransaction, TopupRequest],
  resolve: "./src/modules/wallet",
  testSuite: ({ service }) => {
    describe("wallet module", () => {
      it("stores amounts beyond 32-bit as exact whole numbers", async () => {
        const [wallet] = await service.createWallets([{}])
        const [tx] = await service.createWalletTransactions([
          { wallet_id: wallet.id, type: "manual_topup", amount: 5_000_000_000 },
        ])

        const [stored] = await service.listWalletTransactions({ id: tx.id })
        expect(stored.amount).toEqual(5_000_000_000)
        expect(typeof stored.amount).toEqual("number")
      })

      it("rejects a fractional amount", async () => {
        const [wallet] = await service.createWallets([{}])

        await expect(
          service.createWalletTransactions([
            { wallet_id: wallet.id, type: "manual_topup", amount: 10.5 },
          ])
        ).rejects.toThrow()
      })

      it("has no update or delete path for transactions", async () => {
        const [wallet] = await service.createWallets([{}])
        const [tx] = await service.createWalletTransactions([
          { wallet_id: wallet.id, type: "manual_topup", amount: 5_000 },
        ])

        expect(() => service.updateWalletTransactions({ id: tx.id, amount: 1 })).toThrow(
          /append-only/
        )
        expect(() => service.deleteWalletTransactions([tx.id])).toThrow(/append-only/)
        expect(() => service.softDeleteWalletTransactions([tx.id])).toThrow(/append-only/)
        expect(() => service.restoreWalletTransactions([tx.id])).toThrow(/append-only/)
        expect(await service.listWalletTransactions({ wallet_id: wallet.id })).toHaveLength(1)
        // The row is untouched (no soft-delete slipped through).
        const [row] = await service.listWalletTransactions({ id: tx.id }, { withDeleted: true })
        expect(row.amount).toEqual(5_000)
        expect(row.deleted_at).toBeNull()
      })

      it("top-up requests default to pending and refuse a zero or fractional amount", async () => {
        const [wallet] = await service.createWallets([{}])
        const [request] = await service.createTopupRequests([
          { wallet_id: wallet.id, amount: 1, screenshot_file_key: "private-x.png" },
        ])
        expect(request.status).toEqual("pending")

        for (const amount of [0, 10.5]) {
          await expect(
            service.createTopupRequests([
              { wallet_id: wallet.id, amount, screenshot_file_key: "private-x.png" },
            ])
          ).rejects.toThrow()
        }
      })
    })
  },
})
