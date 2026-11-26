
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "technician"],
      required: true,
      default: "technician"
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true
    }
  },
  { timestamps: true }
);



module.exports = mongoose.model("User", userSchema);
