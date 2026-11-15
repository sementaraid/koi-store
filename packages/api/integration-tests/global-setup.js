const net = require("net")

// @medusajs/test-utils turns on SSL for any test DB URL that doesn't contain
// "localhost" (medusa-test-runner-utils/config.js). The dev Postgres runs in
// its own container with SSL off, so a non-localhost DB_HOST hangs the boot.
// Forward localhost:<DB_PORT> to the real host so the runner sees "localhost".
module.exports = async () => {
  const host = process.env.DB_HOST
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return
  }
  const port = Number(process.env.DB_PORT ?? 5432)

  const server = net.createServer((client) => {
    const upstream = net.connect(port, host)
    client.pipe(upstream).pipe(client)
    client.on("error", () => upstream.destroy())
    upstream.on("error", () => client.destroy())
  })
  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "127.0.0.1", resolve)
  })
  server.unref()

  globalThis.__DB_FORWARD__ = server
  process.env.DB_HOST = "localhost"
}
