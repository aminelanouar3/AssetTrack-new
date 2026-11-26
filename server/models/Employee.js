
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    matricule: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{8}$/, "Matricule must contain exactly 8 digits"]
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
