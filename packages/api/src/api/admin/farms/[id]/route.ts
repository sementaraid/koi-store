import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { ADMIN_FARM_FIELDS, type AdminFarm, toAdminFarms } from "../route"

export type AdminFarmResponse = { farm: AdminFarm }

// US-021 T-021.1 (AC1): one farm with its private registration data.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminFarmResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller",
    fields: ADMIN_FARM_FIELDS,
    filters: { id: req.params.id },
  })
  if (!data.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Farm ${req.params.id} not found`)
  }

  const [farm] = await toAdminFarms(req.scope, data as Parameters<typeof toAdminFarms>[1])
  res.json({ farm })
}
