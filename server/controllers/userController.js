
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const validMatricule = (value) =>
  typeof value === "string" && /^\d{8}$/.test(value);

const validObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const allowedRoles = ["admin", "technician"];

// POST /api/users
const createUser = async (req, res) => {
  try {
    const {
      matricule,
      firstName,
      lastName,
      password,
      role
    } = req.body;

    if (
      !validMatricule(matricule) ||
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        message: "Provide a valid 8-digit matricule, first name, last name, password (at least 8 characters), and role"
      });
    }

    const existingUser = await User.findOne({ matricule });

    if (existingUser) {
      return res.status(409).json({
        message: "This matricule is already used by another user"
      });
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

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        matricule: user.matricule,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This matricule is already used by another user"
      });
    }

    console.error("Create user error:", error);
    return res.status(500).json({
      message: "Server error while creating user"
    });
  }
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      message: "Server error while retrieving users"
    });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    if (!validObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      message: "Server error while retrieving user"
    });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { matricule, firstName, lastName, role } = req.body;

    if (!validObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (matricule !== undefined) {
      if (!validMatricule(matricule)) {
        return res.status(400).json({
          message: "Matricule must contain exactly 8 digits"
        });
      }

      const existingUser = await User.findOne({
        matricule,
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(409).json({
          message: "This matricule is already used by another user"
        });
      }

      user.matricule = matricule;
    }

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return res.status(400).json({
          message: "First name cannot be empty"
        });
      }
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== "string" || !lastName.trim()) {
        return res.status(400).json({
          message: "Last name cannot be empty"
        });
      }
      user.lastName = lastName.trim();
    }

    if (role !== undefined) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Role must be admin or technician"
        });
      }

      // Prevent an admin from removing their own admin role.
      if (
        user._id.toString() === req.user._id.toString() &&
        role !== "admin"
      ) {
        return res.status(400).json({
          message: "You cannot remove your own administrator role"
        });
      }

      // Prevent removing the last active administrator.
      if (user.role === "admin" && role !== "admin" && user.isActive) {
        const activeAdminCount = await User.countDocuments({
          role: "admin",
          isActive: true
        });

        if (activeAdminCount <= 1) {
          return res.status(400).json({
            message: "Cannot remove the last active administrator"
          });
        }
      }

      user.role = role;
    }

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        matricule: user.matricule,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This matricule is already used by another user"
      });
    }

    console.error("Update user error:", error);
    return res.status(500).json({
      message: "Server error while updating user"
    });
  }
};

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!validObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false"
      });
    }

    if (
      id === req.user._id.toString() &&
      isActive === false
    ) {
      return res.status(400).json({
        message: "You cannot deactivate your own account"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (
      user.role === "admin" &&
      user.isActive &&
      isActive === false
    ) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot deactivate the last active administrator"
        });
      }
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        matricule: user.matricule,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      message: "Server error while updating user status"
    });
  }
};

// PATCH /api/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!validObjectId(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "New password must contain at least 8 characters"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      message: "User password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Server error while resetting password"
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword
};
