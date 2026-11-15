const mongoose = require("mongoose");
const storage = require("./objectStorage");

exports.uploadFiles = async (req, taskId, files, attachments, commentId = null) => {
  for (const file of files) {
    const id = new mongoose.Types.ObjectId();
    const key = `${req.session.user.tenantId}/${taskId}/${commentId || "attachments"}/${id}`;
    let stored;
    try { stored = await storage.upload(key, file); }
    catch (err) { if (err.status === 503) throw err; throw Object.assign(new Error("Attachment upload failed. Please try again."), { status: 502 }); }
    const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
    const path = commentId ? `/api/tasks/${taskId}/comments/${commentId}/attachments/${id}` : `/api/tasks/${taskId}/attachments/${id}`;
    attachments.push({ _id: id, file_name: file.originalname.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255) || "attachment", size: file.size, ...stored, link: new URL(path, base).href });
  }
};
exports.cleanupFiles = async (req, files) => {
  await Promise.all(files.filter(file => file.storage_key).map(file => storage.remove(file).catch(err => req.log?.error({ err, key: file.storage_key }, "Attachment cleanup failed"))));
};
