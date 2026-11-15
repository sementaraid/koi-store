import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createTopupRequestWorkflow } from "../../../workflows/create-topup-request"
import type {
  StoreCreateTopupRequestInput,
  StoreGetTopupRequestsParamsType,
} from "./validators"

export type StoreTopupRequest = {
  id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  reason: string | null
  // US-011 fix: screenshots are private. Customers never get a URL or the
  // file key; admin-koi streams the image via POST-authenticated admin route.
  has_screenshot: boolean
  created_at: string
}

export type StoreTopupRequestsResponse = {
  requests: StoreTopupRequest[]
  count: number
  limit: number
  offset: number
}

export type StoreTopupRequestResponse = { request: StoreTopupRequest }

// The fields of a multer memoryStorage file this route reads (no @types/multer).
type UploadedFile = { mimetype: string; buffer: Buffer }

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

const toStoreTopupRequest = (r: {
  id: string
  amount: unknown
  status: StoreTopupRequest["status"]
  reason?: string | null
  screenshot_file_key?: string | null
  created_at: Date | string
}): StoreTopupRequest => ({
  id: r.id,
  amount: Number(r.amount),
  status: r.status,
  reason: r.reason ?? null,
  has_screenshot: !!r.screenshot_file_key,
  created_at: new Date(r.created_at).toISOString(),
})

// US-011 AC1–AC2. The screenshot was parsed, type-checked and size-capped by
// the multer middleware (src/api/middlewares.ts). The balance is not touched.
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateTopupRequestInput> & {
    file?: UploadedFile
  },
  res: MedusaResponse<StoreTopupRequestResponse>
) => {
  const file = req.file
  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "screenshot is required"
    )
  }

  const { result } = await createTopupRequestWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      amount: req.validatedBody.amount,
      screenshot: {
        // Not the client's filename: it is untrusted and ends up in a URL.
        filename: `bukti-transfer.${EXTENSION[file.mimetype]}`,
        mimeType: file.mimetype,
        content: file.buffer.toString("base64"),
      },
    },
  })

  res.json({ request: toStoreTopupRequest(result) })
}

// US-011 AC4: the caller's own requests, newest first. Identity comes from
// auth_context; requests hang off the caller's wallet (customer ↔ wallet link).
export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetTopupRequestsParamsType>,
  res: MedusaResponse<StoreTopupRequestsResponse>
) => {
  const limit = req.validatedQuery.limit ?? 20
  const offset = req.validatedQuery.offset ?? 0
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["wallet.id"],
    filters: { id: req.auth_context.actor_id },
  })
  const walletId: string | undefined = customer?.wallet?.id

  if (!walletId) {
    res.json({ requests: [], count: 0, limit, offset })
    return
  }

  const { data, metadata } = await query.graph({
    entity: "topup_request",
    fields: ["id", "amount", "status", "reason", "screenshot_file_key", "created_at"],
    filters: { wallet_id: walletId },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({
    requests: data.map(toStoreTopupRequest),
    count: metadata?.count ?? 0,
    limit,
    offset,
  })
}
