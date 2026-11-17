const sensitiveKey = /password|passwd|passphrase|otp|token|secret|authorization|cookie|apikey|verificationcode|recoverycode|backupcode/i;

// Copy rather than mutate: handlers still need the original credentials.
function redactLogData(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  const result = Array.isArray(value) ? value.map(item => redactLogData(item, seen))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, sensitiveKey.test(key.replace(/[^a-z0-9]/gi, "")) ? "[redacted]" : redactLogData(item, seen),
    ]));
  seen.delete(value);
  return result;
}

module.exports = redactLogData;
