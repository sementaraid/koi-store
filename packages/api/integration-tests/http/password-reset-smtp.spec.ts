import net from "net"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

jest.setTimeout(120 * 1000)

// US-002 Bug 1 / D-013: proves the real chain, not a mocked notification module:
// medusa-config registers the SMTP provider when SMTP_HOST is set, the reset
// subscriber resolves Modules.NOTIFICATION, and nodemailer puts the message on
// the wire. The sink below speaks just enough SMTP for nodemailer (EHLO, MAIL,
// RCPT, DATA, QUIT) and keeps the message bodies.
type Message = { to: string; raw: string }

const messages: Message[] = []
let smtpServer: net.Server | undefined

// Started at module load so the port is known before the runner's beforeAll
// boots the app with `env`.
const PORT = 2525
smtpServer = net.createServer((socket) => {
  let inData = false
  let current: Message = { to: "", raw: "" }
  let buffer = ""

  socket.write("220 test-smtp ESMTP\r\n")

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8")
    let idx: number
    while ((idx = buffer.indexOf("\r\n")) !== -1) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)

      if (inData) {
        if (line === ".") {
          inData = false
          messages.push(current)
          socket.write("250 OK\r\n")
        } else {
          // Unstuff RFC 5321 dot-stuffing (a body line starting with "." arrives "..").
          current.raw += `${line.startsWith("..") ? line.slice(1) : line}\r\n`
        }
        continue
      }

      const cmd = line.toUpperCase()
      if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) {
        socket.write("250-test-smtp\r\n250 OK\r\n")
      } else if (cmd.startsWith("MAIL FROM")) {
        current = { to: "", raw: "" }
        socket.write("250 OK\r\n")
      } else if (cmd.startsWith("RCPT TO:")) {
        current.to = line.slice(line.indexOf(":") + 1).trim().replace(/^<|>$/g, "")
        socket.write("250 OK\r\n")
      } else if (cmd === "DATA") {
        inData = true
        socket.write("354 End data with <CR><LF>.<CR><LF>\r\n")
      } else if (cmd === "QUIT") {
        socket.write("221 Bye\r\n")
        socket.end()
      } else if (cmd === "RSET") {
        socket.write("250 OK\r\n")
      } else {
        socket.write("250 OK\r\n")
      }
    }
  })
  socket.on("error", () => undefined)
})
smtpServer.listen(PORT, "127.0.0.1")

// `env` alone is too late: the runner loads medusa-config (which decides whether
// to register the SMTP provider) before it applies `env`. Set the vars at module
// load so the config sees them, and restore them when the suite ends.
const previousEnv: Record<string, string | undefined> = {}
const env = {
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: String(PORT),
  SMTP_SECURE: "false",
  SMTP_FROM: "Koi Store <no-reply@koi.dev>",
  STOREFRONT_URL: "http://localhost:3001",
}
for (const [k, v] of Object.entries(env)) {
  previousEnv[k] = process.env[k]
  process.env[k] = v
}

const decodeQuotedPrintable = (raw: string) =>
  raw
    .replace(/=\r\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

const waitForMessage = async (to: string, count = 1) => {
  for (let i = 0; i < 100; i++) {
    const matching = messages.filter((m) => m.to === to)
    if (matching.length >= count) {
      return matching
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  return messages.filter((m) => m.to === to)
}

medusaIntegrationTestRunner({
  inApp: true,
  env,
  testSuite: ({ api, getContainer }) => {
    afterAll(() => {
      smtpServer?.close()
      for (const [k, v] of Object.entries(previousEnv)) {
        if (v === undefined) {
          delete process.env[k]
        } else {
          process.env[k] = v
        }
      }
    })

    it("sends a real email over SMTP with a working reset link", async () => {
      const email = `smtp-${Date.now()}@test.dev`
      await api.post("/auth/customer/emailpass/register", {
        email,
        password: "Rahasia123!",
      })

      const res = await api.post("/auth/customer/emailpass/reset-password", {
        identifier: email,
      })
      expect(res.status).toEqual(201)

      const [message] = await waitForMessage(email)
      expect(message).toBeDefined()

      const body = decodeQuotedPrintable(message.raw)
      const match = body.match(/http:\/\/localhost:3001\/atur-sandi\?token=([^\s"<]+)/)
      expect(match).not.toBeNull()
      const token = decodeURIComponent(match![1])
      expect(token.length).toBeGreaterThan(20)

      // The emailed token is a real credential: it sets a new password.
      const update = await api.post("/auth/customer/emailpass/update", {
        password: "SandiBaru123!",
      }, { headers: { authorization: `Bearer ${token}` } })
      expect(update.status).toEqual(200)

      const login = await api.post("/auth/customer/emailpass", {
        email,
        password: "SandiBaru123!",
      })
      expect(login.status).toEqual(200)

      // The notification row was recorded as sent. idempotency_key is neither
      // a NotificationDTO field nor filterable, so it can't be asserted here.
      const notifications = await getContainer()
        .resolve(Modules.NOTIFICATION)
        .listNotifications({ to: email })
      expect(notifications).toHaveLength(1)
      expect(notifications[0].status).toEqual("success")
      expect(notifications[0].to).toEqual(email)
    })

    it("a redelivered auth.password_reset event sends no second email", async () => {
      const email = `smtp-redeliver-${Date.now()}@test.dev`
      await api.post("/auth/customer/emailpass/register", {
        email,
        password: "Rahasia123!",
      })
      await api.post("/auth/customer/emailpass/reset-password", { identifier: email })
      const [first] = await waitForMessage(email)
      expect(first).toBeDefined()

      const token = decodeQuotedPrintable(first.raw).match(/token=([^\s"<]+)/)![1]
      const eventBus = getContainer().resolve(Modules.EVENT_BUS)
      const payload = { entity_id: email, token, actor_type: "customer" }
      await eventBus.emit({ name: "auth.password_reset", data: payload })
      await eventBus.emit({ name: "auth.password_reset", data: payload })

      // Give any (wrong) second send time to arrive, then count.
      await new Promise((r) => setTimeout(r, 1500))
      expect(messages.filter((m) => m.to === email)).toHaveLength(1)

      const notifications = await getContainer()
        .resolve(Modules.NOTIFICATION)
        .listNotifications({ to: email })
      expect(notifications).toHaveLength(1)
    })
  },
})
