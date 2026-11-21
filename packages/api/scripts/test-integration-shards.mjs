// Runs the HTTP integration suite in Jest shards, concurrently by default.
//
// Sharding exists because one Jest process OOMs at ~37 of 51 spec files.
// Parallelism works because integration-tests/global-setup.js now splits the
// port it listens on (DB_PORT, one per shard) from the real Postgres port it
// forwards to (DB_UPSTREAM_PORT, the same for all). Test databases are named
// `medusa-<ulid>-integration-<workerId>`, and the ulid is fresh per process, so
// concurrent shards never touch each other's database.
//
// Each shard's output goes to its own log file; the summary prints the path
// and each shard's peak RSS.
//
// Usage:
//   bun run test:integration:http:shards              # 3 shards, 2 at a time
//   TEST_SHARD_CONCURRENCY=1 bun run ...              # sequential (old behaviour)
//   TEST_SHARD_COUNT=4 TEST_SHARD_CONCURRENCY=2 bun run ...
//   TEST_SHARD_INDEX=2 TEST_SHARD_COUNT=4 bun run ... # one shard (CI machine)
import { spawn } from "node:child_process"
import { closeSync, mkdtempSync, openSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const jestBin = require.resolve("jest/bin/jest")

const count = Number(process.env.TEST_SHARD_COUNT ?? 3)
if (!Number.isInteger(count) || count < 1) {
  console.error(`Invalid TEST_SHARD_COUNT: ${process.env.TEST_SHARD_COUNT}`)
  process.exit(1)
}

// Default 2: each shard peaks around 2.5-3 GB, and the host runs Postgres plus
// two Next dev servers. Raise it only with room in `free -g`.
const concurrency = Number(
  process.env.TEST_SHARD_CONCURRENCY ?? (process.env.TEST_SHARD_INDEX ? 1 : 2)
)
if (!Number.isInteger(concurrency) || concurrency < 1) {
  console.error(`Invalid TEST_SHARD_CONCURRENCY: ${process.env.TEST_SHARD_CONCURRENCY}`)
  process.exit(1)
}

const only = process.env.TEST_SHARD_INDEX
  ? [Number(process.env.TEST_SHARD_INDEX)]
  : Array.from({ length: count }, (_, i) => i + 1)
if (only.some((i) => !Number.isInteger(i) || i < 1 || i > count)) {
  console.error(`Invalid TEST_SHARD_INDEX: ${process.env.TEST_SHARD_INDEX} (count ${count})`)
  process.exit(1)
}

// The real Postgres port, before any shard rewrites DB_PORT for its listener.
const upstreamPort = process.env.DB_UPSTREAM_PORT ?? process.env.DB_PORT ?? "5432"
const basePort = Number(process.env.DB_PORT ?? 5432)

const dir = mkdtempSync(join(tmpdir(), "koi-jest-shard-"))

// Peak resident set of a live process, read from /proc; 0 when it is gone.
const peakRssKb = (pid) => {
  try {
    const m = readFileSync(`/proc/${pid}/status`, "utf8").match(/VmHWM:\s+(\d+) kB/)
    return m ? Number(m[1]) : 0
  } catch {
    return 0
  }
}

const runShard = (index) =>
  new Promise((resolve) => {
    const out = join(dir, `shard-${index}.json`)
    const log = join(dir, `shard-${index}.log`)
    const fd = openSync(log, "w")
    const started = Date.now()
    const proc = spawn(
      process.execPath,
      [jestBin, "--silent=false", "--runInBand", "--forceExit",
       `--shard=${index}/${count}`, "--json", `--outputFile=${out}`],
      {
        env: {
          ...process.env,
          TEST_TYPE: "integration:http",
          NODE_OPTIONS: "--experimental-vm-modules",
          DB_UPSTREAM_PORT: upstreamPort,
          DB_PORT: String(basePort + index),
        },
        stdio: ["ignore", fd, fd],
      }
    )
    let peakKb = 0
    const timer = setInterval(() => {
      peakKb = Math.max(peakKb, peakRssKb(proc.pid))
    }, 1000)
    proc.on("exit", (code) => {
      clearInterval(timer)
      closeSync(fd)
      let suites = "?"
      let tests = "?"
      try {
        const r = JSON.parse(readFileSync(out, "utf8"))
        suites = `${r.numPassedTestSuites}/${r.numTotalTestSuites}`
        tests = `${r.numPassedTests}/${r.numTotalTests}`
      } catch {
        // json report missing (crash) - counts stay unknown
      }
      resolve({
        index,
        code,
        suites,
        tests,
        seconds: Math.round((Date.now() - started) / 1000),
        peakGb: peakKb ? (peakKb / 1024 / 1024).toFixed(1) : "?",
        log,
      })
    })
  })

// Run `only` in waves of `concurrency`.
const results = []
for (let i = 0; i < only.length; i += concurrency) {
  const wave = only.slice(i, i + concurrency)
  process.stderr.write(`\n=== shards ${wave.join(", ")} of ${count} ===\n`)
  results.push(...(await Promise.all(wave.map(runShard))))
}

process.stderr.write("\n=== shard summary ===\n")
for (const r of results) {
  process.stderr.write(
    `shard ${r.index}/${count}: ${r.code === 0 ? "PASS" : "FAIL"} suites ${r.suites} tests ${r.tests} (${r.seconds}s, peak RSS ${r.peakGb} GB) log ${r.log}\n`
  )
  if (r.code !== 0) {
    const tail = readFileSync(r.log, "utf8").trim().split("\n").slice(-15).join("\n")
    process.stderr.write(tail.replace(/^/gm, "  | ") + "\n")
  }
}
const failed = results.filter((r) => r.code !== 0)
process.stderr.write(`${results.length} shard(s), ${failed.length} failed\n`)
process.exit(failed.length === 0 ? 0 : 1)
