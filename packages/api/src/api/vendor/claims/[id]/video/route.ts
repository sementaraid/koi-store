import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPrivateVideo } from "../../../../utils/private-image"
import { assertSellerNotTerminated } from "../../../../../workflows/steps/sold-lot"
// Brings the `seller_context` request augmentation into this module's program
// (the Koi apps type-check these routes through .mercur/routes.d.ts).
import "../../../../../types/seller-context"

// US-054 T-054.1b (AC3, D-018, D-054): the claim's unboxing video, bytes only,
// private. The farmer must own the claim's lot (`seller_id`) and the farm must
// not be terminated; another farm is 404 with no existence leak. The list
// never carries the key, so this is the only way to the bytes.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  await assertSellerNotTerminated(req.scope, sellerId)

  const {
    data: [claim],
  } = await query.graph({
    entity: "claim",
    fields: ["id", "seller_id", "video_file_key"],
    filters: { id: req.params.id, seller_id: sellerId },
  })

  if (!claim?.video_file_key) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Klaim tidak ditemukan.")
  }

  await sendPrivateVideo(
    req,
    res,
    String(claim.video_file_key),
    "Klaim tidak ditemukan."
  )
}
