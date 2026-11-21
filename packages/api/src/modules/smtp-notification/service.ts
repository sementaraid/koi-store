import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import nodemailer, { type Transporter } from "nodemailer"

export type SmtpOptions = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

// Notification provider for the `email` channel over SMTP (Mailpit in dev).
// Follows docs.medusajs.com/resources/references/notification-provider-module.
// Callers pass ready content ({ subject, html, text }); no template engine.
// D-062 (T-092.13): address `phone` is encrypted at rest, so any address
// rendered into an email must go through `decryptPii`
// (packages/api/src/utils/pii-crypto.ts) first. No order email exists yet.
class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "smtp"

  protected logger_: Logger
  protected from_: string
  protected transporter_: Transporter

  static validateOptions(options: Record<string, unknown>) {
    if (!options.host || !options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP notification provider needs `host` and `from` (SMTP_HOST, SMTP_FROM)."
      )
    }
  }

  constructor({ logger }: { logger: Logger }, options: SmtpOptions) {
    super()
    this.logger_ = logger
    this.from_ = options.from
    this.transporter_ = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user ? { user: options.user, pass: options.pass } : undefined,
    })
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { subject, html, text } = notification.content ?? {}
    if (!subject || (!html && !text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP notifications need content.subject and content.html or content.text."
      )
    }
    const info = await this.transporter_.sendMail({
      from: notification.from || this.from_,
      to: notification.to,
      subject,
      html,
      text,
    })
    return { id: info.messageId }
  }
}

export default SmtpNotificationProviderService
