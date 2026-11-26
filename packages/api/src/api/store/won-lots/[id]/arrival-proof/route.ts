import { MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { submitArrivalProofWorkflow } from "../../../../../workflows/submit-arrival-proof"
import {
  ARRIVAL_PROOF_EXTENSION,
  ARRIVAL_PROOF_IMAGE_MAX_BYTES,
} from "./validators"

export type StoreSubmitArrivalProofResponse = {
  arrival_proof: { uploaded_at: string }
}

// The fields of a multer memoryStorage file this route reads (no @types/multer).
type UploadedFile = { mimetype: string; size: number; buffer: Buffer }

// US-110 T-110.1 (AC2, D-018, D-074). The winner uploads one private photo or
// video showing the koi arrived healthy on a `shipped`/`delivered` lot. Type
// and size were checked by the multer middleware; the 5 MB image cap is checked
// here because the parser must also accept 100 MB videos. Identity comes from
// req.auth_context. Never returns the file key or a URL.
export const POST = async (
  req: AuthenticatedMedusaRequest & { file?: UploadedFile },
  res: MedusaResponse<StoreSubmitArrivalProofResponse>
) => {
  const file = req.file
  // An empty part passes multer's type and size checks; it is not a file.
  if (!file || file.size === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Foto atau video kondisi koi wajib diunggah."
    )
  }
  if (
    file.mimetype.startsWith("image/") &&
    file.size > ARRIVAL_PROOF_IMAGE_MAX_BYTES
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Ukuran foto maksimal 5 MB."
    )
  }

  const { result } = await submitArrivalProofWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      lot_id: req.params.id,
      proof: {
        // Not the client's filename: it is untrusted and ends up in a key.
        filename: `kondisi-koi.${ARRIVAL_PROOF_EXTENSION[file.mimetype]}`,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
      },
    },
  })

  res.status(201).json({
    arrival_proof: {
      uploaded_at: new Date(
        result.uploaded_at as unknown as string
      ).toISOString(),
    },
  })
}
