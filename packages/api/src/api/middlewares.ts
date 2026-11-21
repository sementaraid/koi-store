import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
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
import {
  AdminGetFarmsParams,
  AdminRevealFarmPii,
  AdminSuspendReason,
} from "./admin/farms/validators"
import {
  SetAuctionLiveLink,
  VendorAddDraftLots,
  VendorCreateAuction,
  VendorGetAuctionsParams,
  VendorUpdateAuction,
} from "./vendor/auctions/validators"
import {
  VendorGetSoldLotsParams,
  VendorMarkLotShipped,
  VendorRevealSoldLot,
} from "./vendor/sold-lots/validators"
import {
  AdminApproveAuction,
  AdminGetAuctionsParams,
  AdminRejectAuction,
} from "./admin/auctions/validators"
import { StorePhone } from "./store/customers/validators"
import { StoreGetWalletParams } from "./store/wallet/validators"
import { StoreGetLotsParams } from "./store/lots/validators"
import { StoreGetRatingsParams } from "./store/ratings/validators"
import {
  StoreGetWonLotsParams,
  StoreRevealWonLot,
} from "./store/won-lots/validators"
import { StoreRateLot } from "./store/won-lots/[id]/rating/validators"
import { StorePlaceBid } from "./store/bids/validators"
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
import {
  CLAIM_VIDEO_MAX_BYTES,
  CLAIM_VIDEO_MIME_TYPES,
  StoreCreateClaimBody,
} from "./store/won-lots/[id]/claims/validators"
import {
  captureVendorClaimStatus,
  VendorGetClaimsParams,
} from "./vendor/claims/validators"
import {
  AdminDecideClaimBody,
  AdminGetClaimsParams,
} from "./admin/claims/validators"
import { AdminGetReportsParams } from "./admin/reports/validators"
import { AdminGetAccountsParams } from "./admin/accounts/validators"
import { AdminRevealCustomerPii } from "./admin/customers/[id]/reveal/validators"
import {
  AdminGetStrikesParams,
  AdminGiveStrike,
  AdminRemoveStrike,
} from "./admin/strikes/validators"
import { AdminRemoveBid } from "./admin/bids/validators"
import { AdminCancelReason } from "./admin/lots/validators"
import { AdminGetLiveAuctionsParams } from "./admin/live-auctions/validators"
import { AdminGetFarmBiddersParams } from "./admin/farms/[id]/bidders/validators"
import {
  adminPiiMask,
  storePiiMask,
  vendorPiiMask,
} from "./utils/mask-response"
import {
  decryptPiiResponse,
  encryptPiiBody,
  encryptFarmCustomFields,
} from "./utils/pii-encryption"

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
// they are client mistakes, so report them as 400. `message` localises the
// text (D-055) for uploads whose error the Koi apps show verbatim.
const clientErrorsAsBadRequest = (
  upload: (
    req: MedusaRequest,
    res: MedusaResponse,
    cb: (err?: unknown) => void
  ) => void,
  message?: (err: multer.MulterError) => string
) =>
  (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) =>
    upload(req, res, (err?: unknown) => {
      if (err instanceof multer.MulterError) {
        return next(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            message?.(err) ?? err.message
          )
        )
      }
      next(err)
    })

const parseScreenshot = clientErrorsAsBadRequest(screenshotUpload)

// US-054 T-054.1a (AC2, D-055): the unboxing video, video-only, up to 100 MB.
const claimVideoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLAIM_VIDEO_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    CLAIM_VIDEO_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(
          new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Video harus berformat MP4, WebM, atau QuickTime."
          )
        ),
}).single("video")

const parseClaimVideo = clientErrorsAsBadRequest(claimVideoUpload, (err) =>
  err.code === "LIMIT_FILE_SIZE"
    ? "Ukuran video maksimal 100 MB."
    : "Unggahan video tidak valid."
)

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

// US-021 AC2/AC3 (D-015): a farm rejection is Mercur's suspend with the reason
// the farmer reads. Mercur's own validator makes `reason` optional; this makes
// it required and non-blank. Reads the raw body, so it holds whichever of the
// two validators Medusa's route sorting runs first.
const requireSuspendReason = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const parsed = AdminSuspendReason.safeParse(
    (req.body as Record<string, unknown> | undefined)?.reason
  )
  if (!parsed.success) {
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, "reason is required"))
  }
  next()
}

// US-021 AC3 (D-015): rejection is final. Mercur's unsuspend moves a suspended
// seller straight to `open`, which would approve a rejected registration. A
// farm that was never approved (`approved_at` null) is a rejected
// registration, so unsuspend is refused for it. A seller suspended after
// approval (a later ban) keeps Mercur's unsuspend.
const refuseUnsuspendOfRejectedFarm = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: ["id", "approved_at"],
      filters: { id: req.params.id },
    })
    if (seller && !seller.approved_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "A rejected farm registration is final and cannot be unsuspended."
      )
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default defineMiddlewares({
  routes: [
    // ---------------------------------------------------------------------
    // US-092 T-092.2 (D-039, D-042). Masks on Mercur's and Medusa's own
    // routes, which a `req.disallowed` query filter can't cover: `*relation`
    // selects a relation's scalar columns (a seller's `phone` rides along in
    // `seller.*`), and Mercur's `/vendor/customers` overwrites `req.disallowed`
    // with its own list after ours. These wrap `res.json` instead.
    //
    // No method on purpose (a global matcher), so every verb on the surface is
    // covered, including Mercur's POST approve/suspend replies.
    //
    // Self-view exception (owner, 2026-11-15): the caller's own phone and
    // payment_details stay full on their own record — /store/customers,
    // carts and orders; /vendor/sellers* — and the farm reveal keeps its
    // logged full value (T-092.5, D-042). Everyone else, admins included,
    // gets the mask.
    // US-092 T-092.1 (D-043): column-level encryption. The PII columns are
    // stored as ciphertext; the decrypt wrapper replaces `res.json` *after* the
    // mask wrapper does, so it is the inner one and runs first: mask-response
    // still masks the full value, and no ciphertext reaches a client. Blank
    // values pass through, so a database without the key still boots.
    {
      matcher: "/store",
      middlewares: [storePiiMask, decryptPiiResponse],
    },
    {
      matcher: "/admin",
      middlewares: [adminPiiMask, decryptPiiResponse],
    },
    {
      matcher: "/vendor",
      middlewares: [vendorPiiMask, decryptPiiResponse],
    },
    // US-054 T-054.1b: Mercur owns GET /vendor/claims with a strict query
    // validator that 400s `status`; a method-less matcher (global) runs before
    // it, so the farmer's `?status=` is captured and removed first.
    {
      matcher: "/vendor/claims",
      middlewares: [captureVendorClaimStatus],
    },
    // ---------------------------------------------------------------------
    // Encryption last: it runs on the normalised phone `requirePhone` has
    // already put on the body, and before Medusa's own workflow stores it.
    {
      method: ["POST"],
      matcher: "/store/customers",
      middlewares: [requirePhone(true), encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me",
      middlewares: [requirePhone(false), encryptPiiBody],
    },
    // Medusa's admin customer create/update carries the phone too.
    {
      method: ["POST"],
      matcher: "/admin/customers",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/admin/customers/:id",
      middlewares: [encryptPiiBody],
    },
    // D-043 covers phone wherever it is stored; a saved address carries one.
    {
      method: ["POST"],
      matcher: "/store/customers/me/addresses",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/addresses/:addressId",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/admin/customers/:id/addresses",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/admin/customers/:id/addresses/:addressId",
      middlewares: [encryptPiiBody],
    },
    // US-092 T-092.10 (D-062): Medusa's address snapshots. Their `phone` is
    // written by Medusa's own cart, order, fulfillment and stock-location
    // workflows, so the Koi write routes above never see it. Same storage
    // transform as every other PII column.
    //
    // The cart→order copy needs nothing here: `completeCartWorkflow` spreads
    // the cart's address row verbatim into `order_address` (no transform of
    // `phone`), so the envelope travels with it.
    { method: ["POST"], matcher: "/store/carts", middlewares: [encryptPiiBody] },
    { method: ["POST"], matcher: "/store/carts/:id", middlewares: [encryptPiiBody] },
    { method: ["POST"], matcher: "/admin/orders/:id", middlewares: [encryptPiiBody] },
    { method: ["POST"], matcher: "/admin/draft-orders", middlewares: [encryptPiiBody] },
    { method: ["POST"], matcher: "/admin/draft-orders/:id", middlewares: [encryptPiiBody] },
    { method: ["POST"], matcher: "/admin/fulfillments", middlewares: [encryptPiiBody] },
    {
      method: ["POST"],
      matcher: "/admin/orders/:id/fulfillments",
      middlewares: [encryptPiiBody],
    },
    { method: ["POST"], matcher: "/admin/stock-locations", middlewares: [encryptPiiBody] },
    {
      method: ["POST"],
      matcher: "/admin/stock-locations/:id",
      middlewares: [encryptPiiBody],
    },
    { method: ["POST"], matcher: "/vendor/stock-locations", middlewares: [encryptPiiBody] },
    {
      method: ["POST"],
      matcher: "/vendor/stock-locations/:id",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["GET"],
      matcher: "/store/lots",
      middlewares: [
        // Public: publishable key only, no customer identity (US-040 AC3).
        validateAndTransformQuery(StoreGetLotsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-057 T-057.1b AC2: the public rating list on the farm page. Public:
    // publishable key only, no customer identity.
    {
      method: ["GET"],
      matcher: "/store/ratings",
      middlewares: [
        validateAndTransformQuery(StoreGetRatingsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 10,
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/bids",
      middlewares: [
        // Auth first, so an anonymous request never gets its body parsed.
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformBody(StorePlaceBid),
      ],
    },
    // US-053 T-053.1: `shipped → delivered`, winner only. No body.
    {
      method: ["POST"],
      matcher: "/store/won-lots/:id/delivered",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // US-054 T-054.1a: the winner opens a claim on a delivered lot. Auth
    // first, so an anonymous request never gets its body parsed.
    {
      method: ["POST"],
      matcher: "/store/won-lots/:id/claims",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        parseClaimVideo,
        validateAndTransformBody(StoreCreateClaimBody),
      ],
    },
    // US-056 T-056.1a: the winner confirms the resolved claim (`resolved →
    // confirmed`). No body.
    {
      method: ["POST"],
      matcher: "/store/won-lots/:id/claims/confirm",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // US-057 T-057.1 AC1: the winner rates the farmer once, from `shipped` on.
    // Auth first, so an anonymous request never gets its body parsed.
    {
      method: ["POST"],
      matcher: "/store/won-lots/:id/rating",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformBody(StoreRateLot),
      ],
    },
    // US-051 T-051.6 / US-053 T-053.2: the caller's own won lots, read only.
    // Customer token; no farmer contact in either response (D-052).
    {
      method: ["GET"],
      matcher: "/store/won-lots",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformQuery(StoreGetWonLotsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    {
      method: ["GET"],
      matcher: "/store/won-lots/:id",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // US-051 T-051.3a (D-057): the winner reveals the farmer's bank account.
    // Auth first, so an anonymous request never gets its body parsed.
    {
      method: ["POST"],
      matcher: "/store/won-lots/:id/reveal",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformBody(StoreRevealWonLot),
      ],
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
      // D-043: `copyCustomerPhoneToSeller` writes the (already encrypted)
      // customer phone and the bank details, then the Custom Fields are
      // encrypted; Mercur's workflow stores all of it as ciphertext.
      middlewares: [
        copyCustomerPhoneToSeller,
        encryptPiiBody,
        encryptFarmCustomFields,
      ],
    },
    // D-043: the seller's own later edits of the same fields (Mercur's update
    // routes) store ciphertext too.
    {
      method: ["POST"],
      matcher: "/vendor/sellers/:id",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/vendor/sellers/me",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/vendor/sellers/:id/payment-details",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/vendor/sellers/:id/address",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/admin/sellers/:id",
      middlewares: [encryptPiiBody],
    },
    {
      method: ["POST"],
      matcher: "/admin/sellers/:id/payment-details",
      middlewares: [encryptPiiBody],
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
    // US-030. Mercur's /vendor/* catch-all already authenticates the member
    // and resolves `req.seller_context` from `x-seller-id`; these only validate.
    {
      method: ["GET"],
      matcher: "/vendor/auctions",
      // No query config: the route builds its own fields and pagination from
      // the validated params.
      middlewares: [validateAndTransformQuery(VendorGetAuctionsParams, {})],
    },
    {
      method: ["POST"],
      matcher: "/vendor/auctions",
      middlewares: [validateAndTransformBody(VendorCreateAuction)],
    },
    {
      method: ["POST"],
      matcher: "/vendor/auctions/:id",
      middlewares: [validateAndTransformBody(VendorUpdateAuction)],
    },
    // US-031 (D-032): lots added to a draft. Submit and lot DELETE take no body.
    {
      method: ["POST"],
      matcher: "/vendor/auctions/:id/lots",
      middlewares: [validateAndTransformBody(VendorAddDraftLots)],
    },
    // US-046 T-046.1 (D-061): the farmer's live link, or null to clear it.
    {
      method: ["POST"],
      matcher: "/vendor/auctions/:id/live-link",
      middlewares: [validateAndTransformBody(SetAuctionLiveLink)],
    },
    // US-051 T-051.1b/T-051.5 (D-056). The farmer's sold lots; the reveal of
    // the winner's default shipping address, one value per body.
    {
      method: ["GET"],
      matcher: "/vendor/sold-lots",
      middlewares: [validateAndTransformQuery(VendorGetSoldLotsParams, {})],
    },
    {
      method: ["POST"],
      matcher: "/vendor/sold-lots/:id/reveal",
      middlewares: [validateAndTransformBody(VendorRevealSoldLot)],
    },
    // US-052 T-052.1: `paid → shipped`. Body optional (self-delivery).
    {
      method: ["POST"],
      matcher: "/vendor/sold-lots/:id/shipped",
      middlewares: [validateAndTransformBody(VendorMarkLotShipped)],
    },
    // US-054 T-054.1b: the farmer's claim queue. Mercur's /vendor catch-all
    // authenticates the member; only the query is validated.
    {
      method: ["GET"],
      matcher: "/vendor/claims",
      middlewares: [validateAndTransformQuery(VendorGetClaimsParams, {})],
    },
    // US-032. Admin-authenticated by Medusa's /admin default (D-002).
    {
      method: ["GET"],
      matcher: "/admin/auctions",
      middlewares: [
        validateAndTransformQuery(AdminGetAuctionsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-054 T-054.1b: the admin-koi claim queue. Status defaults to `open`.
    {
      method: ["GET"],
      matcher: "/admin/claims",
      middlewares: [validateAndTransformQuery(AdminGetClaimsParams, {})],
    },
    // US-058 T-058.3: the admin-koi unpaid-report queue. Status defaults to
    // `open`; `winner_id` reads one winner's reports across all time.
    {
      method: ["GET"],
      matcher: "/admin/reports",
      middlewares: [
        validateAndTransformQuery(AdminGetReportsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-059 T-059.1a (AC1, AC4, D-041): give a strike, read one customer's
    // history, remove a strike. Every mutation takes the written reason.
    {
      method: ["POST"],
      matcher: "/admin/strikes",
      middlewares: [validateAndTransformBody(AdminGiveStrike)],
    },
    {
      method: ["GET"],
      matcher: "/admin/strikes",
      middlewares: [validateAndTransformQuery(AdminGetStrikesParams, {})],
    },
    {
      method: ["POST"],
      matcher: "/admin/strikes/:id/remove",
      middlewares: [validateAndTransformBody(AdminRemoveStrike)],
    },
    // US-072 T-072.1a (AC1, AC5, D-024, D-055): the admin removes a bid with a
    // written reason. Admin auth is Medusa's /admin default.
    {
      method: ["POST"],
      matcher: "/admin/bids/:id/remove",
      middlewares: [validateAndTransformBody(AdminRemoveBid)],
    },
    // US-091 T-091.1a (AC1, D-035, D-055): the admin cancels one open lot with
    // a written reason. Admin auth is Medusa's /admin default.
    {
      method: ["POST"],
      matcher: "/admin/lots/:id/cancel",
      middlewares: [validateAndTransformBody(AdminCancelReason)],
    },
    // US-072 T-072.1b (D-002): the admin-koi live monitoring list; only paging.
    {
      method: ["GET"],
      matcher: "/admin/live-auctions",
      middlewares: [
        validateAndTransformQuery(AdminGetLiveAuctionsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-055 T-055.1b: the admin's final decision on a disputed claim. Both
    // take the written reason (AC2).
    {
      method: ["POST"],
      matcher: "/admin/claims/:id/approve",
      middlewares: [validateAndTransformBody(AdminDecideClaimBody)],
    },
    {
      method: ["POST"],
      matcher: "/admin/claims/:id/reject",
      middlewares: [validateAndTransformBody(AdminDecideClaimBody)],
    },
    {
      method: ["POST"],
      matcher: "/admin/auctions/:id/approve",
      middlewares: [validateAndTransformBody(AdminApproveAuction)],
    },
    {
      method: ["POST"],
      matcher: "/admin/auctions/:id/reject",
      middlewares: [validateAndTransformBody(AdminRejectAuction)],
    },
    // US-046 T-046.1 (D-061): the admin's write of the same field.
    {
      method: ["POST"],
      matcher: "/admin/auctions/:id/live-link",
      middlewares: [validateAndTransformBody(SetAuctionLiveLink)],
    },
    // US-091 T-091.1b (AC2, AC3, D-022, D-055): the admin cancels a live
    // auction with a written reason; the same validator as the lot cancel.
    {
      method: ["POST"],
      matcher: "/admin/auctions/:id/cancel",
      middlewares: [validateAndTransformBody(AdminCancelReason)],
    },
    // US-021 T-021.1. The farm queue reads; approve and reject are Mercur's
    // own POST /admin/sellers/:id/approve and /suspend.
    {
      method: ["GET"],
      matcher: "/admin/farms",
      middlewares: [
        validateAndTransformQuery(AdminGetFarmsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-071 T-071.1 (D-002, D-037): one farm's bidder table; paging only.
    {
      method: ["GET"],
      matcher: "/admin/farms/:id/bidders",
      middlewares: [
        validateAndTransformQuery(AdminGetFarmBiddersParams, {
          defaults: [],
          isList: true,
          defaultLimit: 50,
        }),
      ],
    },
    // US-092 T-092.5 (D-042): the logged reveal of one farm PII field.
    {
      method: ["POST"],
      matcher: "/admin/farms/:id/reveal",
      middlewares: [validateAndTransformBody(AdminRevealFarmPii)],
    },
    {
      method: ["POST"],
      matcher: "/admin/sellers/:id/suspend",
      middlewares: [requireSuspendReason],
    },
    {
      method: ["POST"],
      matcher: "/admin/sellers/:id/unsuspend",
      middlewares: [refuseUnsuspendOfRejectedFarm],
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
    // US-070 T-070.1a (D-002, D-055): the admin-koi /pengguna list; `q` searches
    // name or email, paging only otherwise.
    {
      method: ["GET"],
      matcher: "/admin/accounts",
      middlewares: [
        validateAndTransformQuery(AdminGetAccountsParams, {
          defaults: [],
          isList: true,
          defaultLimit: 20,
        }),
      ],
    },
    // US-070 T-070.1b (D-042, D-055): the logged reveal of a customer's phone.
    {
      method: ["POST"],
      matcher: "/admin/customers/:id/reveal",
      middlewares: [validateAndTransformBody(AdminRevealCustomerPii)],
    },
    {
      method: ["POST"],
      matcher: "/admin/customers/:id/wallet-adjustments",
      middlewares: [validateAndTransformBody(AdminCreateWalletAdjustment)],
    },
  ],
})
