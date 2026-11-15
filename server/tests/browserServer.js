// Browser QA against an isolated database; never connects to the configured production database.
const { MongoMemoryServer } = require("mongodb-memory-server");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");
async function start() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("task-force-browser-tests");
  process.env.SESSION_SECRET = "temporary-browser-test-secret";
  process.env.NODE_ENV = "test";
  const seeded = await promisify(execFile)(process.execPath, [path.join(__dirname, "../scripts/seedDemo.js")], { env: process.env, timeout: 30000 });
  console.log(seeded.stdout);
  const app = require("../index");
  await require("../DBConfig").connectDB();
  const server = app.listen(3040, "127.0.0.1", () => console.log("Browser QA: http://127.0.0.1:3040"));
  const close = async () => {
    server.close();
    await app.locals.sessionStore.close();
    await require("mongoose").disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}
start().catch(err => { console.error(err); process.exit(1); });
