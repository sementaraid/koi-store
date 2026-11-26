import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  sendPrivateImage,
  sendPrivateVideo,
} from "../../../../utils/private-image"

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"]

// US-110 T-110.4 (AC4, D-018, D-002): streams the winner's "arrived healthy"
// photo or video for the admin-koi payout row. The file is private and never
// exposed as a URL; Medusa's /admin auth requires an admin token. 404 for an
// unknown payout or no proof.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "lot_payout",
    fields: ["id", "arrival_proof_file_key"],
    filters: { id: req.params.id },
  })
  const payout = row as unknown as
    | { arrival_proof_file_key: string | null }
    | undefined

  const key = payout?.arrival_proof_file_key
  if (!key) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Foto atau video kondisi koi tidak ditemukan."
    )
  }

  const extension = key.split(".").pop() ?? ""
  if (VIDEO_EXTENSIONS.includes(extension)) {
    await sendPrivateVideo(
      req,
      res,
      key,
      "Foto atau video kondisi koi tidak ditemukan."
    )
    return
  }
  await sendPrivateImage(
    req,
    res,
    key,
    "Foto atau video kondisi koi tidak ditemukan."
  )
}
