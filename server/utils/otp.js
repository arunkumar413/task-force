const crypto = require("crypto");

function hashOtp(code) {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "keyboard cat")
    .update(String(code))
    .digest("hex");
}

function otpMatches(code, storedHash) {
  const actual = Buffer.from(hashOtp(code));
  const expected = Buffer.from(String(storedHash || ""));
  if (actual.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(actual, expected);
}

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function maskEmail(email) {
  const value = String(email || "");
  const at = value.indexOf("@");
  if (at <= 1) {
    return value;
  }
  return `${value[0]}***${value.slice(at)}`;
}

module.exports = {
  hashOtp,
  otpMatches,
  generateOtp,
  maskEmail,
};

