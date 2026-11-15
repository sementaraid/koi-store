import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

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

  // The File Module provider exposes file keys, not DB rows; this is the
  // documented way to read a stored file (getAsBuffer / getDownloadStream).
  const fileModule = req.scope.resolve(Modules.FILE)
  let bytes: Buffer
  try {
    bytes = await fileModule.getAsBuffer(request.screenshot_file_key)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Screenshot for top-up request ${req.params.id} not found`
    )
  }

  const ext = String(request.screenshot_file_key).split(".").pop() ?? ""
  // Only the four image types are streamed; anything else is a download. A row
  // written outside the upload path must not render as HTML/SVG in the browser.
  // hasOwnProperty: a key ending in ".constructor" must not resolve to Object's prototype.
  const imageType = Object.prototype.hasOwnProperty.call(CONTENT_TYPE, ext)
    ? CONTENT_TYPE[ext]
    : undefined
  res.setHeader("Content-Type", imageType ?? "application/octet-stream")
  if (!imageType) res.setHeader("Content-Disposition", "attachment")
  // Never let a browser or proxy cache this; it is per-request private data.
  res.setHeader("Cache-Control", "private, no-store")
  res.send(bytes)
}
