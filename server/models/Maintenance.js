const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      required: true
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["Preventive", "Corrective"],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    maintenanceDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed"],
      default: "Planned"
    }
  },
  { timestamps: true }
);

maintenanceSchema.index({ equipmentId: 1 });
maintenanceSchema.index({ maintenanceDate: 1 });
maintenanceSchema.index({ status: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
