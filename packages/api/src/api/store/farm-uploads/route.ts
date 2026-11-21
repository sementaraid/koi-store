import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { uploadFarmFileWorkflow } from "../../../workflows/upload-farm-file"
import type { FarmUploadBodyType } from "./validators"

// The fields of a multer memoryStorage file this route reads (no @types/multer).
type UploadedFile = { mimetype: string; buffer: Buffer }

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

// T-020.5: the file key and public URL only. The KTP key is a provider key
// starting with "private-", never a URL, so nothing private leaks to the
// caller (D-017). Farm photos are public and their URL is returned to use as
// `farm_photo_urls` on the registration.
export type StoreFarmUploadResponse = {
  file_key: string
  url?: string
}

// What the storefront sends as multipart/form-data. multer puts the file on
// req.file, never in the body, so the handler reads only `purpose`.
export type StoreFarmUploadInput = FarmUploadBodyType & { file: Blob }

// The customer prepares the registration: uploads the KTP photo and one farm
// photo before POST /vendor/sellers, which is when the seller exists.
// A KTP uploaded but never attached to a seller stays in private-uploads/
// until the `delete-orphan-ktp` job (US-093) removes it after the retention
// window; the job only ever deletes `private-<ts>-ktp.*` with no seller
// reference.
export const POST = async (
  req: AuthenticatedMedusaRequest<FarmUploadBodyType> & {
    file?: UploadedFile
  },
  res: MedusaResponse<StoreFarmUploadResponse>
) => {
  const file = req.file
  if (!file) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "file is required")
  }

  const purpose = req.validatedBody.purpose
  const access = purpose === "ktp" ? "private" : "public"
  const prefix = purpose === "ktp" ? "ktp" : "kebun"

  const { result } = await uploadFarmFileWorkflow(req.scope).run({
    input: {
      // Not the client's filename: it is untrusted and ends up in a URL key.
      filename: `${prefix}.${EXTENSION[file.mimetype]}`,
      mimeType: file.mimetype,
      content: file.buffer.toString("base64"),
      access,
    },
  })

  const uploaded = result[0]
  res.json({
    file_key: uploaded.id,
    // Never a URL for a private file: the local provider would happily return
    // one, but the key is what the registration stores and admins read.
    url: access === "public" ? uploaded.url : undefined,
  })
}
