
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const validMatricule = (value) =>
  typeof value === "string" && /^\d{8}$/.test(value);

const validObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const allowedRoles = ["admin", "technician"];

class UserServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const createUser = async (data) => {
  const { matricule, firstName, lastName, password, role } = data;

  if (
    !validMatricule(matricule) ||
    typeof firstName !== "string" || !firstName.trim() ||
    typeof lastName !== "string" || !lastName.trim() ||
    typeof password !== "string" || password.length < 8 ||
    !allowedRoles.includes(role)
  ) {
    throw new UserServiceError(
      "Provide a valid 8-digit matricule, first name, last name, password (at least 8 characters), and role",
      400
    );
  }

  const existingUser = await User.findOne({ matricule });

  if (existingUser) {
    throw new UserServiceError(
      "This matricule is already used by another user",
      409
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    matricule,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    password: hashedPassword,
    role,
    isActive: true
  });

  return {
    id: user._id,
    matricule: user.matricule,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive
  };
};

const getUsers = async () => {
  return User.find()
    .select("-password")
    .sort({ createdAt: -1 });
};

const getUserById = async (id) => {
  if (!validObjectId(id)) {
    throw new UserServiceError("Invalid user ID", 400);
  }

  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new UserServiceError("User not found", 404);
  }

  return user;
};

const updateUser = async (id, data, currentUser) => {
  if (!validObjectId(id)) {
    throw new UserServiceError("Invalid user ID", 400);
  }

  const { matricule, firstName, lastName, role } = data;
  const user = await User.findById(id);

  if (!user) {
    throw new UserServiceError("User not found", 404);
  }

  if (matricule !== undefined) {
    if (!validMatricule(matricule)) {
      throw new UserServiceError(
        "Matricule must contain exactly 8 digits",
        400
      );
    }

    const existingUser = await User.findOne({
      matricule,
      _id: { $ne: id }
    });

    if (existingUser) {
      throw new UserServiceError(
        "This matricule is already used by another user",
        409
      );
    }

    user.matricule = matricule;
  }

  if (firstName !== undefined) {
    if (typeof firstName !== "string" || !firstName.trim()) {
      throw new UserServiceError("First name cannot be empty", 400);
    }
    user.firstName = firstName.trim();
  }

  if (lastName !== undefined) {
    if (typeof lastName !== "string" || !lastName.trim()) {
      throw new UserServiceError("Last name cannot be empty", 400);
    }
    user.lastName = lastName.trim();
  }

  if (role !== undefined) {
    if (!allowedRoles.includes(role)) {
      throw new UserServiceError("Role must be admin or technician", 400);
    }

    if (
      user._id.toString() === currentUser._id.toString() &&
      role !== "admin"
    ) {
      throw new UserServiceError(
        "You cannot remove your own administrator role",
        400
      );
    }

    if (user.role === "admin" && role !== "admin" && user.isActive) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true
      });

      if (activeAdminCount <= 1) {
        throw new UserServiceError(
          "Cannot remove the last active administrator",
          400
        );
      }
    }

    user.role = role;
  }

  await user.save();

  return {
    id: user._id,
    matricule: user.matricule,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive
  };
};

const updateUserStatus = async (id, isActive, currentUser) => {
  if (!validObjectId(id)) {
    throw new UserServiceError("Invalid user ID", 400);
  }

  if (typeof isActive !== "boolean") {
    throw new UserServiceError("isActive must be true or false", 400);
  }

  if (id === currentUser._id.toString() && isActive === false) {
    throw new UserServiceError(
      "You cannot deactivate your own account",
      400
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new UserServiceError("User not found", 404);
  }

  if (user.role === "admin" && user.isActive && isActive === false) {
    const activeAdminCount = await User.countDocuments({
      role: "admin",
      isActive: true
    });

    if (activeAdminCount <= 1) {
      throw new UserServiceError(
        "Cannot deactivate the last active administrator",
        400
      );
    }
  }

  user.isActive = isActive;
  await user.save();

  return {
    id: user._id,
    matricule: user.matricule,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive
  };
};

const resetUserPassword = async (id, newPassword) => {
  if (!validObjectId(id)) {
    throw new UserServiceError("Invalid user ID", 400);
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new UserServiceError(
      "New password must contain at least 8 characters",
      400
    );
  }

  const user = await User.findById(id);

  if (!user) {
    throw new UserServiceError("User not found", 404);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
};

module.exports = {
  UserServiceError,
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword
};
