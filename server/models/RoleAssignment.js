const mongoose = require("mongoose");

const roleAssignmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    scope: {
      type: {
        type: String,
        enum: ["global", "department"],
        default: "global",
      },

      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        default: null,
      },
    },
  },
  { timestamps: true }
);

roleAssignmentSchema.index({ tenantId: 1, employeeId: 1 });

module.exports = mongoose.model("RoleAssignment", roleAssignmentSchema);

