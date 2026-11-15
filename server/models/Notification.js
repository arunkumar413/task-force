const mongoose = require("mongoose");
const { Schema } = mongoose;
const schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  actorId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  actorName: { type: String, required: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Todo", required: true },
  commentId: { type: Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["comment_mention"], default: "comment_mention" },
  readAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform(doc, ret) {
  ret.id = ret._id.toString(); delete ret._id; delete ret.__v;
} } });
schema.index({ tenantId: 1, employeeId: 1, createdAt: -1 });
schema.index({ tenantId: 1, employeeId: 1, readAt: 1 });
schema.index({ tenantId: 1, employeeId: 1, taskId: 1, commentId: 1 }, { unique: true });
module.exports = mongoose.model("Notification", schema);
