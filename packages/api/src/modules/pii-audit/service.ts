import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { PiiRevealAudit } from "./models/pii-reveal-audit"

// Append-only audit (D-042): update/delete are unreachable on purpose, same
// pattern as the wallet ledger. No decorated methods (Koi apps' tsc).
const appendOnly = (..._args: unknown[]): never => {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "The PII reveal audit is append-only."
  )
}

class PiiAuditModuleService extends MedusaService({ PiiRevealAudit }) {
  updatePiiRevealAudits = appendOnly
  softDeletePiiRevealAudits = appendOnly
  restorePiiRevealAudits = appendOnly
  deletePiiRevealAudits = appendOnly
}

export default PiiAuditModuleService
