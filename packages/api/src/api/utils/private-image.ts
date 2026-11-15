import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

// D-017/D-018: private uploads (KTP photos, transfer screenshots) are never
// exposed as a URL; admin routes stream them through here. 404 when the
// provider no longer has the file.
export const sendPrivateImage = async (
  req: MedusaRequest,
  res: MedusaResponse,
  fileKey: string,
  notFoundMessage: string
) => {
  // The File Module provider exposes file keys, not DB rows; this is the
  // documented way to read a stored file (getAsBuffer / getDownloadStream).
  const fileModule = req.scope.resolve(Modules.FILE)
  let bytes: Buffer
  try {
    bytes = await fileModule.getAsBuffer(fileKey)
  } catch {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, notFoundMessage)
  }

  const ext = fileKey.split(".").pop() ?? ""
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
