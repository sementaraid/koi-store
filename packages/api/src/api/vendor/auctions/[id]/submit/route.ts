import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { submitAuctionWorkflow } from "../../../../../workflows/submit-auction"
import { getVendorAuctionDetail, type VendorAuctionDetailResponse } from "../route"
// Brings the `seller_context` request augmentation into this module's program.
// The Koi apps type-check these routes through `.mercur/routes.d.ts`, whose
// import graph would otherwise never reach `src/types/`.
import "../../../../../types/seller-context"

// US-031 T-031.1 (AC1–AC4): `draft → pending_approval`. No body. The payer is
// the customer on the member's own auth identity (D-003): Medusa copies the
// identity's app_metadata into the member token, which carries `customer_id`
// (mvp-Q15, D-033). Never from the body.
// 400 `insufficient_balance` → top-up prompt; 409 not a draft; 403 farm not open.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<VendorAuctionDetailResponse>
) => {
  const customerId = req.auth_context.app_metadata?.customer_id
  if (typeof customerId !== "string" || !customerId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Akun petani Anda belum punya profil pelanggan, jadi biaya pasang lelang tidak bisa dibayar."
    )
  }

  await submitAuctionWorkflow(req.scope).run({
    input: {
      seller_id: req.seller_context!.seller_id,
      auction_id: req.params.id,
      customer_id: customerId,
    },
  })

  res.json({
    auction: await getVendorAuctionDetail(
      req.scope,
      req.seller_context!.seller_id,
      req.params.id
    ),
  })
}
