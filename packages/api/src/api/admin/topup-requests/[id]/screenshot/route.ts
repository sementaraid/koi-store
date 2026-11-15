import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendPrivateImage } from "../../../../utils/private-image"

// US-011 fix: transfer screenshots are personal financial data. The file is
// uploaded with access "private" and never exposed as a URL; admins stream it
// here (admin token required by Medusa's /admin auth) when reviewing US-012.
// 404 for an unknown request or a file the provider no longer has.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [request],
  } = await query.graph({
    entity: "topup_request",
    fields: ["id", "screenshot_file_key"],
    filters: { id: req.params.id },
  })

  if (!request?.screenshot_file_key) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Top-up request ${req.params.id} not found`
    )
  }

  await sendPrivateImage(
    req,
    res,
    String(request.screenshot_file_key),
    `Screenshot for top-up request ${req.params.id} not found`
  )
}
