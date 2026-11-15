const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  priorities: [{ type: String, enum: ["Low", "Medium", "High", "Urgent"] }],
  statuses: [{ type: String, enum: ["Pending", "In progress", "Done", "Backlog", "Cancelled"] }],
  labels: [String],
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
}, { timestamps: true, toJSON: { virtuals: true } });
schema.index({ tenantId: 1, employee: 1 });
module.exports = mongoose.model("TaskView", schema);
