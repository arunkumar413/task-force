const mongoose = require("mongoose");
const { Schema } = mongoose;
const attachmentSchema = new Schema({
  file_name: { type: String, required: true, trim: true },
  link: { type: String, required: true, validate: value => /^https?:\/\//i.test(value) },
});
const commentSchema = new Schema({
  comment: { type: String, required: true, trim: true, maxlength: 20000 },
  author: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  username: String,
  email: String,
  attachments: [attachmentSchema],
}, { timestamps: true });
const todoSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, default: "", maxlength: 50000 },
  status: { type: String, enum: ["Pending", "In progress", "Done", "Backlog", "Cancelled"], default: "Backlog" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
  dueDate: { type: Date, default: null },
  labels: [{ type: String, trim: true, maxlength: 100 }],
  tenantId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
  comments: [commentSchema],
  attachments: [attachmentSchema],
  subtasks: [{ title: { type: String, required: true, trim: true }, isDone: { type: Boolean, default: false } }],
}, { timestamps: true, toJSON: { virtuals: true, transform(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
} } });
todoSchema.index({ tenantId: 1, employee: 1, dueDate: 1 });
module.exports = mongoose.model("Todo", todoSchema);
