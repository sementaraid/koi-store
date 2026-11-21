import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto"

// US-092 T-092.1 (D-043): column-level encryption for the PII columns we own —
// seller phone, payment details (account number, holder name, iban,
// routing_number), the farm custom field ktp_nik, and customer phone.
//
// AES-256-GCM with a random 12-byte IV per value. Envelope:
//   enc:v1:<key id>:<iv>:<tag>:<ciphertext>   (base64url parts)
// The version and key id are what make a later key rotation possible without
// re-encrypting in one shot: a value says which key made it. Rotating keys is
// out of scope for this task.
//
// The key comes from `PII_ENCRYPTION_KEY` (base64, 32 bytes), never from the
// database or the repo (AC6). Nothing here logs the key or the plaintext.
const ENVELOPE_PREFIX = "enc:v1:"
const IV_BYTES = 12
const KEY_BYTES = 32

let cached: { key: Buffer; kid: string } | undefined

const key = () => {
  if (cached) return cached
  const raw = process.env.PII_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("PII_ENCRYPTION_KEY is not set; cannot encrypt or decrypt PII.")
  }
  const bytes = Buffer.from(raw, "base64")
  if (bytes.length !== KEY_BYTES) {
    throw new Error(
      `PII_ENCRYPTION_KEY must be ${KEY_BYTES} base64-encoded bytes (got ${bytes.length}).`
    )
  }
  cached = {
    key: bytes,
    kid: createHash("sha256").update(bytes).digest("hex").slice(0, 8),
  }
  return cached
}

export const isPiiEncrypted = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith(ENVELOPE_PREFIX)

const blank = (value: string | null | undefined) =>
  value === null || value === undefined || value.trim() === ""

// Idempotent: a value already carrying the envelope is returned untouched, so
// re-running a write (or the T-092.6 migration) never double-encrypts.
export const encryptPii = (value: string | null | undefined): string | null => {
  if (blank(value)) return null
  const plaintext = value as string
  if (isPiiEncrypted(plaintext)) return plaintext

  const { key: bytes, kid } = key()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", bytes, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [
    ENVELOPE_PREFIX + kid,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":")
}

// A value that is not in the envelope (a pre-migration plaintext row, or a
// field that never held PII) passes through unchanged, so mixed data works
// while T-092.6 migrates. A wrong or missing key makes GCM's tag check throw.
export const decryptPii = (value: string | null | undefined): string | null => {
  if (blank(value)) return null
  const stored = value as string
  if (!isPiiEncrypted(stored)) return stored

  const [, version, kid, ivPart, tagPart, ctPart] = stored.split(":")
  if (version !== "v1" || !kid || !ivPart || !tagPart || ctPart === undefined) {
    throw new Error("Malformed PII ciphertext envelope.")
  }
  const { key: bytes, kid: currentKid } = key()
  if (kid !== currentKid) {
    throw new Error(
      `PII ciphertext was written with key ${kid}, but PII_ENCRYPTION_KEY is ${currentKid}.`
    )
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    bytes,
    Buffer.from(ivPart, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(ctPart, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

// Field names that carry PII in a response or a registration body. Kept here so
// the write path, the response decryptor and the T-092.6 migration agree.
export const PII_FIELDS = [
  "phone",
  "ktp_nik",
  "holder_name",
  "account_number",
  "iban",
  "routing_number",
] as const

type Json = Record<string, unknown>

const isPlainObject = (value: object) => {
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

// Deep copy with every PII-named string decrypted (identity for non-envelopes).
const transform = (
  value: unknown,
  fn: (value: string) => string | null
): unknown => {
  if (Array.isArray(value)) return value.map((child) => transform(child, fn))
  if (!value || typeof value !== "object" || !isPlainObject(value)) return value
  const out: Json = {}
  for (const [field, child] of Object.entries(value as Json)) {
    out[field] =
      (PII_FIELDS as readonly string[]).includes(field) && typeof child === "string"
        ? fn(child)
        : transform(child, fn)
  }
  return out
}

export const decryptPiiFields = <T>(value: T): T =>
  transform(value, decryptPii) as T
