import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import uniqueCustomerScript from "../../src/migration-scripts/customer-wallet-unique-customer"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createCustomersWorkflow, updateCustomersWorkflow } from "@medusajs/medusa/core-flows"
import customerWalletHandler from "../../src/subscribers/customer-wallet"
import { createCustomerWalletWorkflow } from "../../src/workflows/create-customer-wallet"

jest.setTimeout(60 * 1000)

const walletIdsOf = async (container: MedusaContainer, customerId: string) => {
  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "customer_wallet",
    fields: ["wallet_id"],
    filters: { customer_id: customerId },
  })
  return data.map((row: { wallet_id: string }) => row.wallet_id)
}

// Runs the subscriber directly, the way the event bus would.
const emit = (container: MedusaContainer, id: string) =>
  customerWalletHandler({
    event: { name: "customer.updated", data: { id } },
    container,
    pluginOptions: {},
  } as unknown as Parameters<typeof customerWalletHandler>[0])

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    describe("wallet on profile completion", () => {
      it("incomplete profile gets no wallet; completing it gives exactly one; repeats change nothing", async () => {
        const container = getContainer()

        const { result: [customer] } = await createCustomersWorkflow(container).run({
          input: { customersData: [{ email: `cw-${Date.now()}@test.dev`, first_name: "Budi" }] },
        })
        await emit(container, customer.id)
        expect(await walletIdsOf(container, customer.id)).toHaveLength(0)

        await updateCustomersWorkflow(container).run({
          input: {
            selector: { id: customer.id },
            update: { last_name: "Santoso", phone: "  " },
          },
        })
        await emit(container, customer.id)
        expect(await walletIdsOf(container, customer.id)).toHaveLength(0)

        await updateCustomersWorkflow(container).run({
          input: { selector: { id: customer.id }, update: { phone: "081234567890" } },
        })
        await emit(container, customer.id)
        const [walletId] = await walletIdsOf(container, customer.id)
        expect(walletId).toBeDefined()

        // Second event, and two concurrent runs: still the same single wallet.
        await emit(container, customer.id)
        await Promise.all([
          createCustomerWalletWorkflow(container).run({ input: { customer_id: customer.id } }),
          createCustomerWalletWorkflow(container).run({ input: { customer_id: customer.id } }),
        ])
        expect(await walletIdsOf(container, customer.id)).toEqual([walletId])
      })

      it("creates the wallet from the customer.created event the create workflow emits", async () => {
        const container = getContainer()
        const { result: [customer] } = await createCustomersWorkflow(container).run({
          input: {
            customersData: [
              {
                email: `cw-created-${Date.now()}@test.dev`,
                first_name: "Budi",
                last_name: "Santoso",
                phone: "081234567890",
              },
            ],
          },
        })

        // No manual emit: the workflow's own customer.created must reach the
        // subscriber. Polls because the local event bus dispatches async.
        for (let i = 0; i < 50 && !(await walletIdsOf(container, customer.id)).length; i++) {
          await new Promise((r) => setTimeout(r, 100))
        }

        expect(await walletIdsOf(container, customer.id)).toHaveLength(1)
      })

      it("creates the wallet from the customer.updated event the update workflow emits", async () => {
        const container = getContainer()
        const { result: [customer] } = await createCustomersWorkflow(container).run({
          input: { customersData: [{ email: `cw-updated-${Date.now()}@test.dev` }] },
        })
        expect(await walletIdsOf(container, customer.id)).toHaveLength(0)

        await updateCustomersWorkflow(container).run({
          input: {
            selector: { id: customer.id },
            update: {
              first_name: "Budi",
              last_name: "Santoso",
              phone: "081234567890",
            },
          },
        })

        for (let i = 0; i < 50 && !(await walletIdsOf(container, customer.id)).length; i++) {
          await new Promise((r) => setTimeout(r, 100))
        }

        expect(await walletIdsOf(container, customer.id)).toHaveLength(1)
      })

      it("creates the wallet through the event bus (not by calling the handler directly)", async () => {
        const container = getContainer()
        // Direct module create: no event, so the wallet must come from the
        // event this test emits, not from setup.
        const [customer] = await container.resolve(Modules.CUSTOMER).createCustomers([
          {
            email: `cw-event-${Date.now()}@test.dev`,
            first_name: "Budi",
            last_name: "Santoso",
            phone: "081234567890",
          },
        ])

        const eventBus = container.resolve(Modules.EVENT_BUS)

        // Polls: the local event bus dispatches subscribers asynchronously.
        const waitForWallet = async () => {
          for (let i = 0; i < 50; i++) {
            const ids = await walletIdsOf(container, customer.id)
            if (ids.length) {
              return ids
            }
            await new Promise((r) => setTimeout(r, 100))
          }
          return []
        }

        expect(await waitForWallet()).toHaveLength(0)
        await eventBus.emit({ name: "customer.updated", data: { id: customer.id } })
        expect(await waitForWallet()).toEqual([expect.any(String)])

        // A redelivered event is idempotent.
        await eventBus.emit({ name: "customer.updated", data: { id: customer.id } })
        await new Promise((r) => setTimeout(r, 500))
        expect(await walletIdsOf(container, customer.id)).toHaveLength(1)
      })

      it("the database rejects a second wallet link for one customer", async () => {
        const container = getContainer()
        const { result: [customer] } = await createCustomersWorkflow(container).run({
          input: { customersData: [{ email: `cw2-${Date.now()}@test.dev` }] },
        })
        // medusaIntegrationTestRunner runs migrations + link sync but not
        // migration scripts (db:migrate does), so apply the project script here.
        await uniqueCustomerScript({ container, args: [] })

        const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
        const insert = (walletId: string) =>
          pg.raw(
            `INSERT INTO customer_customer_wallet_wallet (id, customer_id, wallet_id) VALUES (?, ?, ?)`,
            [`test_${walletId}`, customer.id, walletId]
          )

        await insert("wal_a")
        await expect(insert("wal_b")).rejects.toThrow(/UQ_customer_wallet_customer_id/)
      })
    })
  },
})
