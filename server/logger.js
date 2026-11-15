const pino = require("pino");
module.exports = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: { paths: ["req.headers.cookie", "req.headers.authorization", "password", "confirmPassword", "otp", "body", "req.body"], censor: "[redacted]" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
