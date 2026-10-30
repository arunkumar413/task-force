const AuthSession = require("../models/AuthSession");
const { SESSION_MAX_AGE_MS } = require("../constants");

const TOUCH_INTERVAL_MS = 60 * 1000;

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

function describeDevice(userAgent) {
  const ua = String(userAgent || "");
  if (!ua) {
    return "Unknown device";
  }

  let browser = "Browser";
  if (/Edg\//.test(ua)) {
    browser = "Edge";
  } else if (/Chrome\//.test(ua) || /CriOS\//.test(ua)) {
    browser = "Chrome";
  } else if (/Firefox\//.test(ua) || /FxiOS\//.test(ua)) {
    browser = "Firefox";
  } else if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && !/CriOS\//.test(ua)) {
    browser = "Safari";
  }

  let os = "";
  if (/Windows/.test(ua)) {
    os = "Windows";
  } else if (/Android/.test(ua)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/.test(ua)) {
    os = "iOS";
  } else if (/Mac OS X/.test(ua)) {
    os = "macOS";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  return os ? `${browser} on ${os}` : browser;
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_MAX_AGE_MS);
}

async function forgetSession(sessionId) {
  if (!sessionId) {
    return;
  }
  await AuthSession.deleteOne({ sessionId });
}

async function upsertAuthSession(req, options) {
  const user = req.session && req.session.user;
  if (!user || !user.id || !req.sessionID) {
    return;
  }

  const now = new Date();
  const userAgent = req.get("user-agent") || "";
  const ip = clientIp(req);
  const force = options && options.force;

  if (!force) {
    const existing = await AuthSession.findOne({ sessionId: req.sessionID }).lean();
    if (
      existing &&
      existing.lastSeenAt &&
      now - existing.lastSeenAt < TOUCH_INTERVAL_MS
    ) {
      return;
    }
  }

  await AuthSession.findOneAndUpdate(
    { sessionId: req.sessionID },
    {
      $set: {
        employeeId: user.id,
        tenantId: user.tenantId,
        userAgent,
        ip,
        lastSeenAt: now,
        expiresAt: sessionExpiry(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function serializeAuthSession(doc, currentSessionId) {
  return {
    id: doc._id.toString(),
    device: describeDevice(doc.userAgent),
    userAgent: doc.userAgent || "",
    ip: doc.ip || "",
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    lastSeenAt: doc.lastSeenAt ? doc.lastSeenAt.toISOString() : null,
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    current: doc.sessionId === currentSessionId,
  };
}

async function listEmployeeSessions(employeeId, currentSessionId) {
  await AuthSession.deleteMany({
    employeeId,
    expiresAt: { $lte: new Date() },
  });

  const sessions = await AuthSession.find({
    employeeId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastSeenAt: -1 })
    .lean();

  return sessions.map(function (doc) {
    return serializeAuthSession(doc, currentSessionId);
  });
}

async function revokeOtherSessions(employeeId, keepSessionId, sessionStore) {
  const others = await AuthSession.find({
    employeeId,
    sessionId: { $ne: keepSessionId },
  }).lean();

  for (const doc of others) {
    if (sessionStore && typeof sessionStore.destroy === "function") {
      await new Promise(function (resolve) {
        sessionStore.destroy(doc.sessionId, function () {
          resolve();
        });
      });
    }
    await forgetSession(doc.sessionId);
  }
}

function touchAuthSession(req) {
  upsertAuthSession(req).catch(function (err) {
    console.log(err);
  });
}

module.exports = {
  clientIp,
  describeDevice,
  forgetSession,
  upsertAuthSession,
  listEmployeeSessions,
  revokeOtherSessions,
  touchAuthSession,
};

