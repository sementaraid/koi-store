import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

type PasswordResetEvent = { entity_id: string; token: string; actor_type: string }

// storefront-koi: ROUTES.newPassword ("/atur-sandi"), which reads `?token=`
// (app/(auth)/atur-sandi/page.tsx).
export const resetUrl = (storefrontUrl: string, token: string) =>
  `${storefrontUrl.replace(/\/+$/, "")}/atur-sandi?token=${encodeURIComponent(token)}`

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// US-002 Bug 1. Payload per docs.medusajs.com/resources/references/auth/events
// (auth.password_reset: entity_id = the email for emailpass, token, actor_type).
// Pattern: docs.medusajs.com/resources/commerce-modules/auth/reset-password.
// Only customers get an email for now; admin (`user`) and farmer (`member`)
// resets are logged and skipped until their flows exist.
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (data.actor_type !== "customer") {
    logger.info(
      `password-reset: no email sent for actor_type "${data.actor_type}" (only customer resets are emailed for now)`
    )
    return
  }

  const storefrontUrl = process.env.STOREFRONT_URL
  if (!storefrontUrl) {
    logger.error("password-reset: STOREFRONT_URL is not set, reset email not sent")
    return
  }

  const url = resetUrl(storefrontUrl, data.token)
  try {
    // Notification module directly, as Medusa's reset-password guide does: a
    // sent email can't be compensated, so a workflow adds nothing here.
    // idempotency_key = the token, so a redelivered event sends no second email.
    await container.resolve(Modules.NOTIFICATION).createNotifications({
      to: data.entity_id,
      channel: "email",
      idempotency_key: `password-reset:${data.token}`,
      content: {
        subject: "Atur ulang kata sandi Anda",
        text:
          `Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.\n\n` +
          `Buka tautan ini untuk membuat kata sandi baru:\n${url}\n\n` +
          `Jika Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.`,
        html:
          `<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda.</p>` +
          `<p><a href="${escapeHtml(url)}">Buat kata sandi baru</a></p>` +
          `<p>Jika Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.</p>`,
      },
    })
  } catch (e) {
    // Never the token or URL in logs: whoever reads them could reset the password.
    logger.error(`password-reset: sending the reset email failed: ${e}`)
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
