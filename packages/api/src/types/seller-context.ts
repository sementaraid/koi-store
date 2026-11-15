// Mercur's `seller_context` is declared on express Request in @mercurjs/core's
// own type bundle, which this project's routes never import, so the property is
// missing on the request types here. Same shape as Mercur's SellerContext; set
// by Mercur's ensureSellerMiddleware for every /vendor/* route.
export type SellerContext = {
  seller_id: string
  currency_code: string
  seller_member: {
    id: string
    seller_id: string
    member_id: string
    role_id: string | null
  }
}

declare module "@medusajs/framework/http" {
  interface MedusaRequest {
    seller_context?: SellerContext
  }
}
