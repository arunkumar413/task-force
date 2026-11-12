const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
  labels: [{ type: String, trim: true, maxlength: 1000 }],
});

module.exports = mongoose.model("OrganizationLabels", schema);
