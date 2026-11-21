import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  ContainerRegistrationKeys,
  generateJwtToken,
  Modules,
} from "@medusajs/framework/utils"
import { createRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { isPiiEncrypted } from "../../src/utils/pii-crypto"

jest.setTimeout(120 * 1000)

const PHONE = "+6281211122233"

const isCiphertext = (value: unknown) =>
  isPiiEncrypted(value) && !String(value).includes(PHONE)

// US-092 T-092.10/T-092.11 (D-062, AC1/AC3). Medusa's own cart, order and
// stock-location workflows write `phone` into the address snapshots, so the
// proof is a real write through the real route: ciphertext on disk, plaintext
// or mask in the response, and never an `enc:v1:` envelope on the wire.
medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: Record<string, string>
    let regionId: string

    const pg = () => getContainer().resolve(ContainerRegistrationKeys.PG_CONNECTION)

    const phoneRow = async (table: string, id: string) => {
      const result = await pg().raw(`SELECT phone FROM ${table} WHERE id = ?`, [id])
      const rows = (result.rows ?? result) as { phone?: string | null }[]
      return rows[0]?.phone ?? null
    }

    beforeAll(async () => {
      const [key] = await getContainer()
        .resolve(Modules.API_KEY)
        .createApiKeys([{ title: "test", type: "publishable", created_by: "test" }])
      storeHeaders = { "x-publishable-api-key": key.token }

      const { result } = await createRegionsWorkflow(getContainer()).run({
        input: {
          regions: [
            {
              name: "Indonesia",
              currency_code: "idr",
              countries: ["id"],
              payment_providers: ["pp_system_default"],
            },
          ],
        },
      })
      regionId = result[0].id
    })

    const adminHeaders = async () => {
      const container = getContainer()
      const [user] = await container
        .resolve(Modules.USER)
        .createUsers([{ email: `snap-${Date.now()}-${Math.random()}@test.dev` }])
      const { http } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
        .projectConfig
      const token = generateJwtToken(
        {
          actor_id: user.id,
          actor_type: "user",
          auth_identity_id: "",
          app_metadata: {},
          user_metadata: {},
        },
        { secret: http.jwtSecret, expiresIn: "1h" }
      )
      return { authorization: `Bearer ${token}` }
    }

    const address = {
      first_name: "Budi",
      last_name: "Santoso",
      address_1: "Jl. Raya Bogor 1",
      city: "Bogor",
      province: "Jawa Barat",
      country_code: "id",
      phone: PHONE,
    }

    // Mercur patches the store line-item route to require an `offer_id`, and
    // its complete-cart step rejects an item with no seller or an offer with no
    // inventory item. All three are orthogonal to the address snapshot, so the
    // item goes in through the cart module and is linked by SQL (the shape
    // farm-registration.spec.ts uses). Returns the order id.
    const completeCart = async (
      cartId: string,
      auth: Record<string, string>
    ) => {
      const [lineItem] = await getContainer()
        .resolve(Modules.CART)
        .addLineItems(cartId, [
          {
            title: "Kohaku snap",
            quantity: 1,
            unit_price: 100000,
            requires_shipping: false,
          } as never,
        ])
      const offerId = `offer_snap_${Date.now()}_${Math.random()}`
      await pg().raw(
        `insert into "offer"
           (id, seller_id, variant_id, shipping_profile_id, sku, created_by, product_id,
            manage_inventory, allow_backorder, created_at, updated_at)
         values (?, 'sel_snap', 'variant_snap', 'sp_snap', 'SKU-SNAP', 'member_snap', 'prod_snap',
                 false, true, now(), now())`,
        [offerId]
      )
      await pg().raw(
        `insert into "cart_line_item_offer_offer" (id, line_item_id, offer_id, created_at, updated_at)
         values (?, ?, ?, now(), now())`,
        [`clio_${Date.now()}_${Math.random()}`, lineItem.id, offerId]
      )
      const inventoryItemId = `iitem_${Date.now()}_${Math.random()}`
      await pg().raw(
        `insert into "inventory_item" (id, sku, requires_shipping, created_at, updated_at)
         values (?, 'SKU-SNAP-INV', false, now(), now())`,
        [inventoryItemId]
      )
      await pg().raw(
        `insert into "offer_inventory_item" (id, offer_id, inventory_item_id, required_quantity, created_at, updated_at)
         values (?, ?, ?, 1, now(), now())`,
        [`ofi_${Date.now()}_${Math.random()}`, offerId, inventoryItemId]
      )

      const collection = await api.post(
        "/store/payment-collections",
        { cart_id: cartId },
        { headers: { ...storeHeaders, ...auth } }
      )
      await api.post(
        `/store/payment-collections/${collection.data.payment_collection.id}/payment-sessions`,
        { provider_id: "pp_system_default" },
        { headers: { ...storeHeaders, ...auth } }
      )
      // Mercur patches completion to return an order group rather than the
      // bare order, so the order ids live in the link table.
      const completed = await api.post(
        `/store/carts/${cartId}/complete`,
        {},
        { headers: { ...storeHeaders, ...auth } }
      )
      expect(completed.data.type).toEqual("order_group")
      const groupId = (completed.data.order_group as { id: string }).id
      const orderRows = await pg().raw(
        `SELECT order_id FROM order_group_order WHERE order_group_id = ?`,
        [groupId]
      )
      const orders = (orderRows.rows ?? orderRows) as { order_id: string }[]
      expect(orders.length).toBeGreaterThan(0)
      return orders[0].order_id
    }

    it("stores a cart address phone as ciphertext and returns it plaintext to the cart's owner (AC1, AC3)", async () => {
      const created = await api.post(
        "/store/carts",
        { region_id: regionId, shipping_address: address },
        { headers: storeHeaders }
      )
      expect(created.status).toEqual(200)
      const cart = created.data.cart as {
        id: string
        shipping_address: { id: string; phone: string }
      }

      const stored = await phoneRow("cart_address", cart.shipping_address.id)
      expect(isCiphertext(stored)).toBe(true)

      // T-092.11: the storewide decrypt wrapper turns the envelope back into
      // the customer's own phone — no `enc:v1:` anywhere in the body.
      const read = await api.get("/store/carts/" + cart.id, { headers: storeHeaders })
      expect(read.data.cart.shipping_address.phone).toEqual(PHONE)
      expect(JSON.stringify(read.data)).not.toContain("enc:v1:")
    })

    it("copies the cart's encrypted phone verbatim into order_address and returns plaintext (AC1, AC3)", async () => {
      const email = `snap-buyer-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const auth = { authorization: `Bearer ${registered.data.token}` }

      const cartResponse = await api.post(
        "/store/carts",
        { region_id: regionId, email, shipping_address: address },
        { headers: storeHeaders }
      )
      const cart = cartResponse.data.cart as {
        id: string
        shipping_address: { id: string }
      }
      const cartId = cart.id
      const orderId = await completeCart(cartId, auth)

      const orderAddress = await pg().raw(
        `SELECT id, phone FROM order_address WHERE id = (
           SELECT shipping_address_id FROM "order" WHERE id = ?
         )`,
        [orderId]
      )
      const [row] = (orderAddress.rows ?? orderAddress) as {
        id: string
        phone: string
      }[]
      expect(isCiphertext(row.phone)).toBe(true)
      // The copy is verbatim: same envelope as the cart row it came from.
      expect(row.phone).toEqual(
        await phoneRow("cart_address", cart.shipping_address.id)
      )

      const read = await api.get(`/store/orders/${orderId}?fields=*shipping_address,*billing_address`, {
        headers: { ...storeHeaders, ...auth },
      })
      expect(read.data.order.shipping_address.phone).toEqual(PHONE)
      expect(JSON.stringify(read.data)).not.toContain("enc:v1:")
    })

    it("stores a stock location address phone as ciphertext and returns the mask to an admin (AC1, AC3)", async () => {
      const admin = await adminHeaders()
      const created = await api.post(
        "/admin/stock-locations",
        { name: `Kolam snap ${Date.now()}`, address },
        { headers: admin }
      )
      expect(created.status).toEqual(200)
      const location = created.data.stock_location as {
        id: string
        address: { id: string; phone: string }
      }

      expect(isCiphertext(await phoneRow("stock_location_address", location.address.id))).toBe(
        true
      )
      // Admins get the mask, never the envelope and never the full value (D-042).
      expect(created.data.stock_location.address.phone).toEqual("+62********233")
      expect(JSON.stringify(created.data)).not.toContain("enc:v1:")
    })

    it("updates a stock location address through the admin route and keeps the phone encrypted", async () => {
      const admin = await adminHeaders()
      const created = await api.post(
        "/admin/stock-locations",
        { name: `Gudang snap ${Date.now()}`, address },
        { headers: admin }
      )
      const location = created.data.stock_location as { id: string; address: { id: string } }

      const updated = await api.post(
        `/admin/stock-locations/${location.id}`,
        { name: "Gudang snap", address: { ...address, phone: "+6281299988877" } },
        { headers: admin }
      )
      expect(updated.status).toEqual(200)
      const stored = await phoneRow("stock_location_address", location.address.id)
      expect(isPiiEncrypted(stored)).toBe(true)
      expect(stored).not.toContain("+6281299988877")
    })

    it("completes an order when the cart address has no phone (nullable, no envelope)", async () => {
      const email = `snap-nophone-${Date.now()}@test.dev`
      const registered = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: "Rahasia123!" },
        { headers: storeHeaders }
      )
      const auth = { authorization: `Bearer ${registered.data.token}` }
      // Same address, no `phone` key at all: the column is nullable and the
      // encryption step must pass a missing value through untouched.
      const { phone: _omitted, ...noPhone } = address
      const cartResponse = await api.post(
        "/store/carts",
        { region_id: regionId, email, shipping_address: noPhone },
        { headers: storeHeaders }
      )
      const cart = cartResponse.data.cart as { id: string }
      expect(
        (cartResponse.data.cart as { shipping_address: { phone: string | null } })
          .shipping_address.phone ?? null
      ).toBeNull()

      const orderId = await completeCart(cart.id, auth)
      const orderAddress = await pg().raw(
        `SELECT phone FROM order_address WHERE id = (
           SELECT shipping_address_id FROM "order" WHERE id = ?
         )`,
        [orderId]
      )
      const [row] = (orderAddress.rows ?? orderAddress) as { phone: string | null }[]
      expect(row.phone).toBeNull()

      const read = await api.get(`/store/orders/${orderId}?fields=*shipping_address`, {
        headers: { ...storeHeaders, ...auth },
      })
      expect(JSON.stringify(read.data)).not.toContain("enc:v1:")
    })

    it("leaves a legacy plaintext cart address row readable and unchanged (idempotent decrypt)", async () => {      const created = await api.post(
        "/store/carts",
        { region_id: regionId, shipping_address: address },
        { headers: storeHeaders }
      )
      const cart = created.data.cart as { id: string; shipping_address: { id: string } }

      // Simulate a row written before T-092.10.
      await pg().raw(`UPDATE cart_address SET phone = ? WHERE id = ?`, [
        "+6281200000001",
        cart.shipping_address.id,
      ])

      const read = await api.get("/store/carts/" + cart.id, { headers: storeHeaders })
      expect(read.data.cart.shipping_address.phone).toEqual("+6281200000001")
      expect(await phoneRow("cart_address", cart.shipping_address.id)).toEqual(
        "+6281200000001"
      )
    })
  },
})
