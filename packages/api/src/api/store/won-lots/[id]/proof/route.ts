import { MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { submitLotPaymentProofWorkflow } from "../../../../../workflows/submit-lot-payment-proof"
import {
  toWonLotPaymentProof,
  type WonLotPaymentProof,
} from "../../route"

export type StoreSubmitLotPaymentProofResponse = {
  proof: WonLotPaymentProof
}

// The fields of a multer memoryStorage file this route reads (no @types/multer).
type UploadedFile = { mimetype: string; size: number; buffer: Buffer }

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

// US-109 T-109.1 (AC1, AC2, D-077, D-018). The winner uploads one private proof
// image on a `won` lot; the admin confirms or rejects it. Type and size were
// checked by the multer middleware (src/api/middlewares.ts); identity comes from
// req.auth_context. Never returns the file key or a URL.
export const POST = async (
  req: AuthenticatedMedusaRequest & { file?: UploadedFile },
  res: MedusaResponse<StoreSubmitLotPaymentProofResponse>
) => {
  const file = req.file
  // An empty part passes multer's type and size checks; it is not an image.
  if (!file || file.size === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Bukti transfer wajib diunggah."
    )
  }

  const { result } = await submitLotPaymentProofWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      lot_id: req.params.id,
      proof: {
        // Not the client's filename: it is untrusted and ends up in a key.
        filename: `bukti-transfer.${EXTENSION[file.mimetype]}`,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
      },
    },
  })

  res.status(201).json({
    proof: toWonLotPaymentProof(result as unknown as Record<string, unknown>),
  })
}
