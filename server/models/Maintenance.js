
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: {
    type: Number,
    default: 0
  }
});

const Counter =
  mongoose.models.Counter ||
  mongoose.model("Counter", counterSchema);

const maintenanceSchema = new mongoose.Schema(
  {
    _id: {
      type: Number
    },
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
    typeMaintenance: {
      type: String,
      enum: ["Préventive", "Corrective"],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    dateMaintenance: {
      type: Date,
      required: true
    },
    cout: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    statut: {
      type: String,
      enum: ["Planifiée", "En cours", "Terminée", "Annulée"],
      default: "Planifiée"
    },
    resultat: {
      type: String,
      trim: true,
      default: ""
    },
    prochaineDateMaintenance: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

maintenanceSchema.pre("validate", async function () {
  if (this.isNew && this._id == null) {
    const compteur = await Counter.findOneAndUpdate(
      { _id: "maintenance" },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true
      }
    );

    this._id = compteur.seq;
  }
});

maintenanceSchema.index({ equipmentId: 1 });
maintenanceSchema.index({ technicianId: 1 });
maintenanceSchema.index({ dateMaintenance: -1 });
maintenanceSchema.index({ statut: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
