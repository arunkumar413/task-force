const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      index: true,
    },
    read: { type: Boolean, default: false },
    write: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

permissionSchema.index({ role: 1, resource: 1 }, { unique: true });
permissionSchema.index({ tenantId: 1, role: 1, resource: 1 });
permissionSchema.index({ role: 1, resource: 1, read: 1 });
permissionSchema.index({ role: 1, resource: 1, write: 1 });
permissionSchema.index({ role: 1, resource: 1, update: 1 });
permissionSchema.index({ role: 1, resource: 1, delete: 1 });

module.exports = mongoose.model("Permission", permissionSchema);

