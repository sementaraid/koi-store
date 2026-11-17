import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

// US-054 T-054.1b: the video types the claim upload accepts (AC2).
const VIDEO_CONTENT_TYPE: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
}

const sendPrivateFile = async (
  req: MedusaRequest,
  res: MedusaResponse,
  fileKey: string,
  notFoundMessage: string,
  contentTypes: Record<string, string>
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
  // Only the listed types are streamed; anything else is a download. A row
  // written outside the upload path must not render as HTML/SVG in the browser.
  // hasOwnProperty: a key ending in ".constructor" must not resolve to Object's prototype.
  const contentType = Object.prototype.hasOwnProperty.call(contentTypes, ext)
    ? contentTypes[ext]
    : undefined
  res.setHeader("Content-Type", contentType ?? "application/octet-stream")
  if (!contentType) res.setHeader("Content-Disposition", "attachment")
  // Never let a browser or proxy cache this; it is per-request private data.
  res.setHeader("Cache-Control", "private, no-store")
  res.send(bytes)
}

// D-017/D-018: private uploads (KTP photos, transfer screenshots) are never
// exposed as a URL; admin routes stream them through here. 404 when the
// provider no longer has the file.
export const sendPrivateImage = (
  req: MedusaRequest,
  res: MedusaResponse,
  fileKey: string,
  notFoundMessage: string
) => sendPrivateFile(req, res, fileKey, notFoundMessage, CONTENT_TYPE)

// US-054 T-054.1b: the claim's unboxing video, same private read, video types.
export const sendPrivateVideo = (
  req: MedusaRequest,
  res: MedusaResponse,
  fileKey: string,
  notFoundMessage: string
) => sendPrivateFile(req, res, fileKey, notFoundMessage, VIDEO_CONTENT_TYPE)
