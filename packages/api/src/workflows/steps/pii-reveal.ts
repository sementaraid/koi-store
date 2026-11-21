import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ADMIN_FARM_FIELDS,
  type AdminFarmRow,
  applicantsByEmail,
  memberEmailOf,
} from "../../api/admin/farms/route"
import type { FarmPiiField } from "../../api/admin/farms/validators"
import { PII_AUDIT_MODULE } from "../../modules/pii-audit"
import type PiiAuditModuleService from "../../modules/pii-audit/service"
import { decryptPii } from "../../utils/pii-crypto"


// Read only: the full value of one farm PII field. 404 when the farm is missing.
export const readFarmPiiStep = createStep(
  "read-farm-pii",
  async (input: { farm_id: string; field: FarmPiiField }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "seller",
      fields: ADMIN_FARM_FIELDS,
      filters: { id: input.farm_id },
    })
    const row = data[0] as AdminFarmRow | undefined
    if (!row) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Farm ${input.farm_id} not found`)
    }

    // D-043: the columns hold ciphertext; the reveal returns plaintext.
    let value: string | null
    switch (input.field) {
      case "ktp_nik":
        value = decryptPii(row.custom_fields?.ktp_nik)
        break
      case "account_number":
        value = decryptPii(row.payment_details?.account_number)
        break
      case "holder_name":
        value = decryptPii(row.payment_details?.holder_name)
        break
      case "phone":
        value = decryptPii(row.phone)
        break
      case "applicant_phone": {
        const email = memberEmailOf(row)
        const applicants = await applicantsByEmail(container, email ? [email] : [])
        value = decryptPii(email ? applicants.get(email)?.phone : null)
        break
      }
    }
    return new StepResponse(value)
  }
)

// Read only: the full phone of one customer. 404 when the customer is missing.
// US-070 T-070.1b: only `phone` is a customer field this screen reveals.
export const readCustomerPhoneStep = createStep(
  "read-customer-phone",
  async (input: { customer_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "phone"],
      filters: { id: input.customer_id },
    })
    if (!customer) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Akun tidak ditemukan.")
    }
    // D-043: the column holds ciphertext.
    return new StepResponse(decryptPii(customer.phone as string | null | undefined))
  }
)

export type CreatePiiRevealAuditStepInput = {
  actor_type: string
  actor_id: string
  record_type: string
  record_id: string
  field: string
}

// One mutation: append the audit row (D-042). Generic so the winner's own-lot
// reveal (US-051, D-044) reuses it. No compensation, like the wallet ledger:
// the table is append-only and this is the workflow's last step, so no later
// failure can require an undo.
export const createPiiRevealAuditStep = createStep(
  "create-pii-reveal-audit",
  async (input: CreatePiiRevealAuditStepInput, { container }) => {
    const service = container.resolve<PiiAuditModuleService>(PII_AUDIT_MODULE)
    const [row] = await service.createPiiRevealAudits([input])
    return new StepResponse(row)
  }
)
