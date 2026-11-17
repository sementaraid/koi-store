import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { openClaimWorkflow } from "../../../../../workflows/open-claim"
import type { StoreCreateClaimBodyType } from "./validators"
import { CLAIM_VIDEO_EXTENSION } from "./validators"

export type StoreClaim = {
  id: string
  lot_id: string
  status: string
  remedy: "refund" | "replacement"
  // The claim row's created_at (no separate column).
  opened_at: string
}

export type StoreClaimResponse = { claim: StoreClaim }

// The fields of a multer memoryStorage file this route reads (no @types/multer).
type UploadedFile = { mimetype: string; size: number; buffer: Buffer }

// US-054 T-054.1a (AC1, AC2, AC4). The video was parsed, type-checked and
// size-capped by the multer middleware (src/api/middlewares.ts). Identity from
// req.auth_context. Never returns the file key or URL (D-018).
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateClaimBodyType> & {
    file?: UploadedFile
  },
  res: MedusaResponse<StoreClaimResponse>
) => {
  const file = req.file
  // An empty part passes multer's type and size checks; it is not a video.
  if (!file || file.size === 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Video unboxing wajib diunggah."
    )
  }

  const { result } = await openClaimWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      lot_id: req.params.id,
      remedy: req.validatedBody.remedy,
      video: {
        // Not the client's filename: it is untrusted and becomes a key.
        filename: `unboxing.${CLAIM_VIDEO_EXTENSION[file.mimetype]}`,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
      },
    },
  })

  res.status(201).json({
    claim: {
      id: result.id,
      lot_id: result.lot_id,
      status: result.status,
      remedy: result.remedy as StoreClaim["remedy"],
      opened_at: new Date(result.created_at).toISOString(),
    },
  })
}
