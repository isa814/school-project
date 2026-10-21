// Local-only helper: runs PostgreSQL for development without a separate database service.
// Usage: node scripts/pg-local.mjs   (keeps running; listens on localhost:5432)
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), ".pgdata-local");
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

if (!fs.existsSync(dataDir)) {
  await pg.initialise();
}
if (process.platform === "win32") {
  const configPath = path.join(dataDir, "postgresql.conf");
  const config = await fs.promises.readFile(configPath, "utf8");
  const windowsConfig = /^\s*dynamic_shared_memory_type\s*=.*$/m;
  const nextConfig = windowsConfig.test(config)
    ? config.replace(windowsConfig, "dynamic_shared_memory_type = windows")
    : `${config.trimEnd()}\ndynamic_shared_memory_type = windows\n`;
  if (nextConfig !== config) await fs.promises.writeFile(configPath, nextConfig);
}
await pg.start();
try {
  await pg.createDatabase("ansar_ruhul");
} catch (error) {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "42P04") {
    throw error;
  }
}
console.log("PostgreSQL ready: postgresql://postgres:postgres@localhost:5432/ansar_ruhul");
process.on("SIGTERM", async () => { await pg.stop(); process.exit(0); });
process.on("SIGINT", async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 1 << 30);
