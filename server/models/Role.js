const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: String,

    fullAccess: {
      type: Boolean,
      default: false,
    },

    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);

