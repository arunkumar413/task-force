const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (err) { next(err); } };
const scope = req => ({ tenantId: req.session.user.tenantId, employeeId: req.session.user.id });
exports.list = handle(async (req, res) => {
  const filter = scope(req);
  const [data, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  res.set("Cache-Control", "no-store").json({ data, unreadCount });
});
exports.readAll = handle(async (req, res) => {
  await Notification.updateMany({ ...scope(req), readAt: null }, { $set: { readAt: new Date() } });
  res.status(204).end();
});
exports.read = handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.notificationId)) return res.status(400).json({ statusMessage: "Invalid notification ID" });
  const filter = { ...scope(req), _id: req.params.notificationId };
  const item = await Notification.findOne(filter);
  if (!item) return res.status(404).json({ statusMessage: "Notification not found" });
  await Notification.updateOne({ ...filter, readAt: null }, { $set: { readAt: new Date() } });
  res.status(204).end();
});
