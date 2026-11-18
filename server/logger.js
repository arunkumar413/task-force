const pino = require("pino");
const fs = require("node:fs");
const path = require("node:path");
const redactLogData = require("./utils/redactLogData");
const { createStream } = require("rotating-file-stream");
const { finished } = require("node:stream/promises");

const logDir = process.env.LOG_DIR || path.join(__dirname, "logs");
const level = process.env.LOG_LEVEL || "info";
fs.mkdirSync(logDir, { recursive: true });

const maxFiles = Number(process.env.LOG_MAX_FILES ?? 14);
if (!Number.isSafeInteger(maxFiles) || maxFiles < 1) throw new Error("LOG_MAX_FILES must be a positive integer");
const options = { path: logDir, size: process.env.LOG_MAX_SIZE || "10M", interval: "1d", maxFiles };
const appLogs = createStream("app.log", options);
const errorLogs = createStream("error.log", options);
for (const stream of [appLogs, errorLogs]) {
  stream.on("error", err => process.stderr.write(`Log file output failed: ${err.message}\n`));
  stream.on("warning", err => process.stderr.write(`Log rotation warning: ${err.message}\n`));
}

const logger = pino({
  level,
  redact: { paths: ["req.body", "req.headers.cookie", "req.headers.authorization", "password", "confirmPassword", "otp", "token", "accessToken", "refreshToken", "secret", "query.password", "query.confirmPassword", "query.otp", "query.token"], censor: "[redacted]" },
  serializers: { body: () => undefined, query: redactLogData },
  // Defense in depth for explicit logger calls as well as HTTP records.
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream([
  { level, stream: process.stdout },
  { level, stream: appLogs },
  { level: "error", stream: errorLogs },
]));

// Await buffered writes before shutdown, tests, or benchmark measurements.
let closing;
logger.close = () => closing ||= Promise.all([appLogs, errorLogs].map(stream => {
  const complete = finished(stream);
  stream.end();
  return complete;
}));
module.exports = logger;
