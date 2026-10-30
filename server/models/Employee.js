const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },

    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    ancestorManagers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        index: true,
      },
    ],

    roleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    mustSetPassword: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

employeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, username: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, managerId: 1 });
employeeSchema.index({ tenantId: 1, ancestorManagers: 1 });

employeeSchema.pre("save", async function (next) {
  if (!this.managerId) {
    this.ancestorManagers = [];
    return next();
  }

  const manager = await mongoose.model("Employee").findById(this.managerId);

  this.ancestorManagers = [...(manager?.ancestorManagers || []), this.managerId];

  next();
});

employeeSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("Employee", employeeSchema);

