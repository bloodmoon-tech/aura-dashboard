const fs = require("fs")
const { Client } = require("pg")

// Load env from .env.development.local (sandbox doesn't inject runtime env vars)
try {
  const envFile = fs.readFileSync(__dirname + "/../.env.development.local", "utf8")
  for (const line of envFile.split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (m) {
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!process.env[m[1]]) process.env[m[1]] = val
    }
  }
} catch (e) {
  console.log("[v0] no env file:", e.message)
}

async function main() {
  const sql = fs.readFileSync(__dirname + "/001_init_schema.sql", "utf8")
  const conn = (process.env.POSTGRES_URL_NON_POOLING || "").split("?")[0]
  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  await client.query(sql)
  console.log("[v0] Schema applied successfully")
  const res = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  )
  console.log("[v0] public tables:", res.rows.map((r) => r.table_name).join(", "))
  await client.end()
}

main().catch((e) => {
  console.error("[v0] Error:", e.message)
  process.exit(1)
})
