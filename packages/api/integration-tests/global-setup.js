const net = require("net")

// @medusajs/test-utils turns on SSL for any test DB URL that doesn't contain
// "localhost" (medusa-test-runner-utils/config.js). The dev Postgres runs in
// its own container with SSL off, so a non-localhost DB_HOST hangs the boot.
// Forward localhost:<DB_PORT> to the real host so the runner sees "localhost".
//
// Two ports, on purpose: concurrent Jest shards each need their own listen port
// on 127.0.0.1 (DB_PORT, set per shard by scripts/test-integration-shards.mjs)
// while all of them connect to the one real Postgres port (DB_UPSTREAM_PORT).
// With DB_UPSTREAM_PORT unset both are DB_PORT, i.e. the old single-run
// behaviour is unchanged.
//
// On the host (DB_HOST=localhost) a plain run connects directly; only shards,
// whose DB_PORT differs from the real port, still need the forward.
module.exports = async () => {
  const host = process.env.DB_HOST
  const port = Number(process.env.DB_PORT ?? 5432)
  const upstreamPort = Number(process.env.DB_UPSTREAM_PORT ?? port)
  const local = host === "localhost" || host === "127.0.0.1"
  if (!host || (local && port === upstreamPort)) {
    return
  }

  const server = net.createServer((client) => {
    const upstream = net.connect(upstreamPort, host)
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
