require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const User = require("../models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, resolve);
  });

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("An administrator account already exists.");
      return;
    }

    const matricule = (await ask("Enter matricule (8 digits): ")).trim();
    const firstName = (await ask("Enter first name: ")).trim();
    const lastName = (await ask("Enter last name: ")).trim();
    const password = await ask("Enter password (minimum 8 characters): ");

    if (!/^\d{8}$/.test(matricule)) {
      throw new Error("Matricule must contain exactly 8 digits.");
    }

    if (!firstName || !lastName) {
      throw new Error("First name and last name are required.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const existingUser = await User.findOne({ matricule });

    if (existingUser) {
      throw new Error("This matricule is already used.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      matricule,
      firstName,
      lastName,
      password: hashedPassword,
      role: "admin",
      isActive: true
    });

    console.log("\nAdministrator created successfully.");
    console.log(`Matricule: ${admin.matricule}`);
    console.log(`Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`Role: ${admin.role}`);
  } catch (error) {
    console.error("\nAdmin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

createAdmin();
