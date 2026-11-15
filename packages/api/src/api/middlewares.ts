import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import multer from "multer"
import {
  AdminCreateFeeCategory,
  AdminUpdateFeeCategory,
} from "./admin/fee-categories/validators"
import {
  AdminCreateWalletAdjustment,
  AdminGetCustomerWalletParams,
} from "./admin/customers/[id]/wallet/validators"
import { AdminUpdateSettings } from "./admin/settings/validators"
import {
  AdminApproveTopupRequest,
  AdminGetTopupRequestsParams,
  AdminRejectTopupRequest,
} from "./admin/topup-requests/validators"
import { StorePhone } from "./store/customers/validators"
import { StoreGetWalletParams } from "./store/wallet/validators"
import {
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_MIME_TYPES,
  StoreCreateTopupRequest,
  StoreGetTopupRequestsParams,
} from "./store/topup-requests/validators"
import {
  FARM_UPLOAD_MAX_BYTES,
  FARM_UPLOAD_MIME_TYPES,
  FarmUploadBody,
} from "./store/farm-uploads/validators"
import {
  copyCustomerPhoneToSeller,
  FarmRegistrationAdditionalData,
} from "./utils/farm-registration"

// Medusa's documented upload pattern (docs.medusajs.com/learn/fundamentals/
// api-routes/parse-body#configure-file-uploads): multer in memory, then the
// route hands the buffer to the File Module through a workflow.
const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SCREENSHOT_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    SCREENSHOT_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "screenshot must be a JPEG, PNG or WebP image"
          )
        ),
}).single("screenshot")

// multer's own errors (file too large, unexpected field) would surface as 500;
// they are client mistakes, so report them as 400.
const clientErrorsAsBadRequest = (
  upload: (
    req: MedusaRequest,
    res: MedusaResponse,
    cb: (err?: unknown) => void
  ) => void
) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    upload(req, res, (err?: unknown) => {
      if (err instanceof multer.MulterError) {
        return next(new MedusaError(MedusaError.Types.INVALID_DATA, err.message))
      }
      next(err)
    })

const parseScreenshot = clientErrorsAsBadRequest(screenshotUpload)

// US-020 T-020.5: the registration photos, uploaded before the seller exists.
const farmFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FARM_UPLOAD_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    FARM_UPLOAD_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "file must be a JPEG, PNG or WebP image"
          )
        ),
}).single("file")

const parseFarmFile = clientErrorsAsBadRequest(farmFileUpload)

// US-020 T-020.6 (D-017). No method on purpose: a method-less matcher is
// registered as a global middleware, so it runs before Mercur's own
// validateAndTransformQuery and `req.disallowed` is read (and cleared) by it. A
// method-specific entry on a leaf path would sort after Mercur's own entry for
// that path and arrive too late to affect the query.
//
// On `/store` rather than `/store/sellers`: the public product and offer
// routes can also walk the seller link (`?fields=+seller.payment_details.*`),
// and AC5 says these fields never appear on a public route. No store query
// config declares its own `disallowed`, so nothing is replaced here.
// ponytail: the segment match hides a future public `custom_fields` of any
// store entity too; add an entity-scoped pattern when one is needed.
const STORE_SELLER_PRIVATE_FIELDS = [
  "payment_details",
  "professional_details",
  "custom_fields",
]
const hideSellerPrivateFields = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.disallowed = STORE_SELLER_PRIVATE_FIELDS
  next()
}

// D-008 on Medusa's stock customer routes, added as an extra middleware on the
// same matcher (the pattern in docs.medusajs.com/resources/how-to-tutorials/
// tutorials/phone-auth#c-disable-phone-updates-in-medusa). Runs before the
// stock validateAndTransformBody, which then sees the normalised phone.
// required: POST /store/customers must carry a phone. Otherwise (POST /me) the
// phone may be omitted (left unchanged) but never cleared or malformed.
const requirePhone =
  (required: boolean) =>
  (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    if (!required && !("phone" in body)) {
      return next()
    }
    const parsed = StorePhone.safeParse(body.phone)
    if (!parsed.success) {
      return next(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid phone: ${parsed.error.issues[0]?.message ?? "phone is required"}`
        )
      )
    }
    // Normalise both: which of the stock validator and this middleware runs
    // first depends on Medusa's route sorting, not on this file.
    body.phone = parsed.data
    const validated = req.validatedBody as Record<string, unknown> | undefined
    if (validated) {
      validated.phone = parsed.data
    }
    next()
  }

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/store/customers",
      middlewares: [requirePhone(true)],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me",
      middlewares: [requirePhone(false)],
    },
    {
      method: ["GET"],
      matcher: "/store/wallet",
      middlewares: [
        // Store routes allow unauthenticated requests by default; the wallet
        // needs a customer identity.
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformQuery(StoreGetWalletParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/topup-requests",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformQuery(StoreGetTopupRequestsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/topup-requests",
      middlewares: [
        // Auth first, so an anonymous request never gets its body parsed.
        authenticate("customer", ["bearer", "session"]),
        parseScreenshot,
        validateAndTransformBody(StoreCreateTopupRequest),
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/platform-bank-account",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // US-020 T-020.5. Mercur's POST /vendor/uploads needs an existing seller
    // and stores files publicly, so registration photos come through here.
    // Identity is the customer's token: at this point the farmer is still a
    // customer and only becomes a member when POST /vendor/sellers runs.
    {
      method: ["POST"],
      matcher: "/store/farm-uploads",
      middlewares: [
        // Auth first, so an anonymous request never gets its body parsed.
        authenticate("customer", ["bearer", "session"]),
        parseFarmFile,
        validateAndTransformBody(FarmUploadBody),
      ],
    },
    // US-020 T-020.6 (D-017). No method on purpose: a method-less matcher is
    // registered as a global middleware, so it runs before Mercur's own
    // validateAndTransformQuery for the same path and `req.disallowed` is read
    // (and cleared) by it. A method-specific entry would sort after Mercur's
    // and arrive too late to affect the query.
    {
      matcher: "/store",
      middlewares: [hideSellerPrivateFields],
    },
    // US-020 T-020.7/T-020.8. The farm-style registration body: member_email
    // must be the caller's email (checked in the workflow hook, which has the
    // auth identity), the browser's phone is ignored in favour of the
    // customer's, and additional_data carries the farm Custom Fields.
    {
      method: ["POST"],
      matcher: "/vendor/sellers",
      additionalDataValidator: FarmRegistrationAdditionalData,
      middlewares: [copyCustomerPhoneToSeller],
    },
    {
      method: ["POST"],
      matcher: "/admin/settings",
      middlewares: [validateAndTransformBody(AdminUpdateSettings)],
    },
    {
      method: ["POST"],
      matcher: "/admin/fee-categories",
      middlewares: [validateAndTransformBody(AdminCreateFeeCategory)],
    },
    {
      method: ["POST"],
      matcher: "/admin/fee-categories/:id",
      middlewares: [validateAndTransformBody(AdminUpdateFeeCategory)],
    },
    // US-012. Admin routes are already admin-authenticated by default
    // (Medusa adds the user actor); a customer token is refused before these.
    {
      method: ["GET"],
      matcher: "/admin/topup-requests",
      middlewares: [
        validateAndTransformQuery(AdminGetTopupRequestsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/admin/topup-requests/:id/approve",
      middlewares: [validateAndTransformBody(AdminApproveTopupRequest)],
    },
    {
      method: ["POST"],
      matcher: "/admin/topup-requests/:id/reject",
      middlewares: [validateAndTransformBody(AdminRejectTopupRequest)],
    },
    // US-013. Sub-paths of /admin/customers/:id that Medusa core doesn't use.
    {
      method: ["GET"],
      matcher: "/admin/customers/:id/wallet",
      middlewares: [
        validateAndTransformQuery(AdminGetCustomerWalletParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/admin/customers/:id/wallet-adjustments",
      middlewares: [validateAndTransformBody(AdminCreateWalletAdjustment)],
    },
  ],
})
