import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPrivateVideo } from "../../../../utils/private-image"

// US-054 T-054.1b (AC3, D-002, D-018): the claim's unboxing video for the
// admin-koi queue. Bytes only; Medusa's /admin auth refuses any other actor.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [claim],
  } = await query.graph({
    entity: "claim",
    fields: ["id", "video_file_key"],
    filters: { id: req.params.id },
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
