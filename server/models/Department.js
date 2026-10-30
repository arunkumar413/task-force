const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },

  name: { type: String, required: true },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: null
  },

  // 🔥 Key for fast hierarchy queries
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    index: true
  }]
}, { timestamps: true });

// Compound index for SaaS isolation
departmentSchema.index({ tenantId: 1, parentId: 1 });

departmentSchema.pre("save", async function (next) {
    if (!this.parentId) {
      this.ancestors = [];
      return next();
    }
  
    const parent = await mongoose.model("Department").findById(this.parentId);
  
    this.ancestors = [
      ...(parent?.ancestors || []),
      this.parentId
    ];
  
    next();
  });

module.exports = mongoose.model("Department", departmentSchema);
