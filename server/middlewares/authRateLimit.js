const crypto = require("node:crypto");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  _id: String,
  count: Number,
  expiresAt: Date,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const AuthRateLimit = mongoose.model("AuthRateLimit", schema);
const WINDOW_MS = 15 * 60 * 1000;

// Atomic MongoDB counters are shared across processes. TTL cleanup is not needed
// for correctness: a new fixed window always uses a different key.
function rateLimit(scope, limit, identify) {
  return async (req, res, next) => {
    try {
      const now = Date.now();
      const window = Math.floor(now / WINDOW_MS);
      const key = crypto.createHash("sha256").update(scope + ":" + window + ":" + identify(req)).digest("hex");
      let counter;
      try {
        counter = await AuthRateLimit.findOneAndUpdate({ _id: key }, {
          $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * WINDOW_MS) },
        }, { upsert: true, new: true });
      } catch (err) {
        if (err.code !== 11000) throw err;
        counter = await AuthRateLimit.findOneAndUpdate({ _id: key }, { $inc: { count: 1 } }, { new: true });
      }
      if (counter.count > limit) {
        res.set("Retry-After", String(Math.ceil(((window + 1) * WINDOW_MS - now) / 1000)));
        return res.status(429).json({ statusMessage: "Too many attempts. Please try again later." });
      }
      next();
    } catch (err) { next(err); } // Fail closed if the shared limiter is unavailable.
  };
}
const ip = req => req.ip || req.socket.remoteAddress || "unknown";
const account = req => typeof req.body.email === "string" ? req.body.email.toLowerCase().trim().slice(0, 320) : "invalid";
module.exports = {
  loginLimits: [rateLimit("login-ip", 100, ip), rateLimit("login-account", 10, account)],
  registrationLimit: rateLimit("register-ip", 20, ip),
  emailChangeLimit: rateLimit("profile-reauth", 10, req => req.session.user.id),
  AuthRateLimit,
};
