import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { sendPrivateImage } from "../../../../utils/private-image"

// US-021 T-021.1 (AC1, D-017): the KTP photo, streamed to an admin token only.
// The key never leaves the server; 404 when the farm has none.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "custom_fields.ktp_photo_key"],
    filters: { id: req.params.id },
  })

  const key = (seller as { custom_fields?: { ktp_photo_key?: string | null } | null } | undefined)
    ?.custom_fields?.ktp_photo_key
  if (!key) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `KTP photo for farm ${req.params.id} not found`
    )
  }

  await sendPrivateImage(req, res, key, `KTP photo for farm ${req.params.id} not found`)
}
