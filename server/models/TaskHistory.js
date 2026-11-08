const mongoose = require("mongoose");
const { Schema } = mongoose;

const schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  taskId: { type: Schema.Types.ObjectId, ref: "Todo", required: true, index: true },
  actor: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  actorName: { type: String, required: true },
  action: { type: String, enum: ["created", "updated", "commented"], required: true },
  occurredAt: { type: Date, required: true, default: Date.now },
  changes: [{ _id: false, field: { type: String, required: true }, before: Schema.Types.Mixed, after: Schema.Types.Mixed }],
});
schema.index({ tenantId: 1, taskId: 1, occurredAt: 1 });
module.exports = mongoose.model("TaskHistory", schema);
