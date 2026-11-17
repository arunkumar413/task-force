const pino = require("pino");
const fs = require("node:fs");
const path = require("node:path");
const redactLogData = require("./utils/redactLogData");

const logDir = process.env.LOG_DIR || path.join(__dirname, "logs");
const level = process.env.LOG_LEVEL || "info";
fs.mkdirSync(logDir, { recursive: true });

const appLogs = pino.destination({ dest: path.join(logDir, "app.log"), sync: false });
const errorLogs = pino.destination({ dest: path.join(logDir, "error.log"), sync: false });

module.exports = pino({
  level,
  redact: { paths: ["req.headers.cookie", "req.headers.authorization", "password", "confirmPassword", "otp", "token", "accessToken", "refreshToken", "secret", "query.password", "query.confirmPassword", "query.otp", "query.token"], censor: "[redacted]" },
  serializers: { body: redactLogData, query: redactLogData },
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.multistream([
  { level, stream: process.stdout },
  { level, stream: appLogs },
  { level: "error", stream: errorLogs },
]));
