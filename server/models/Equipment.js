const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true
    },
    assignedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    returnedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: true }
);

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ["Available", "Assigned", "Maintenance", "Retired"],
      default: "Available"
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    purchaseDate: {
      type: Date,
      required: true
    },
    warrantyEndDate: {
      type: Date,
      default: null
    },
    currentEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    assignmentHistory: {
      type: [assignmentSchema],
      default: []
    }
  },
  { timestamps: true }
);

// Text search index
equipmentSchema.index({
  name: "text",
  brand: "text",
  model: "text",
  serialNumber: "text",
  tags: "text"
});

// Useful filtering indexes
equipmentSchema.index({ categoryId: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ currentEmployeeId: 1 });
equipmentSchema.index({ purchaseDate: 1 });

module.exports = mongoose.model("Equipment", equipmentSchema);
