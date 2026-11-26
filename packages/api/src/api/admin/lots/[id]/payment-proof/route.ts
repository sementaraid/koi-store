import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPrivateImage } from "../../../../utils/private-image"

// US-109 T-109.1 (AC2, D-018, D-002): the admin-koi queue streams the winner's
// transfer proof here. The file is private and never exposed as a URL; Medusa's
// /admin auth requires an admin token. 404 for an unknown lot or no proof.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [raw],
  } = await query.graph({
    entity: "lot",
    fields: ["id", "payment_proof_file_key"],
    filters: { id: req.params.id },
  })
  const lot = raw as unknown as
    | { payment_proof_file_key: string | null }
    | undefined

  if (!lot?.payment_proof_file_key) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment proof for lot ${req.params.id} not found`
    )
  }

  await sendPrivateImage(
    req,
    res,
    String(lot.payment_proof_file_key),
    `Payment proof for lot ${req.params.id} not found`
  )
}
