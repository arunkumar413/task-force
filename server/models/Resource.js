const mongoose = require("mongoose");

const ACTIONS = ["read", "write", "update", "delete"];

const resourceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 255,
    },
    actions: {
      type: [String],
      default: function () {
        return ACTIONS.slice();
      },
    },
  },
  { timestamps: true }
);

resourceSchema.index({ name: 1 });

module.exports = mongoose.model("Resource", resourceSchema);
module.exports.ACTIONS = ACTIONS;

