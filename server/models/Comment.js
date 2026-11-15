const mongoose = require("mongoose");
const { Schema } = mongoose;

const attachmentSchema = new Schema({
  file_name: { type: String, required: true, trim: true },
  link: { type: String, required: true, validate: value => /^https?:\/\//i.test(value) },
  storage_key: String,
  storage_bucket: String,
  size: Number,
});

const schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Todo", required: true, index: true },
  comment: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  notificationsPending: { type: Boolean, default: true, select: false },
  username: String,
  email: String,
  attachments: [attachmentSchema],
}, { timestamps: true });
schema.index({ tenantId: 1, taskId: 1, createdAt: 1 });
module.exports = mongoose.model("Comment", schema);
