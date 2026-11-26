
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { matricule, password } = req.body;

    if (
      typeof matricule !== "string" ||
      !/^\d{8}$/.test(matricule) ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "A valid 8-digit matricule and password are required"
      });
    }

    const user = await User.findOne({ matricule }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid matricule or password"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid matricule or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication configuration error"
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
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
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      matricule: req.user.matricule,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      isActive: req.user.isActive
    }
  });
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "Current password is required and new password must contain at least 8 characters"
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Account not found or deactivated"
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      message: "Server error while changing password"
    });
  }
};

module.exports = {
  login,
  getMe,
  changePassword
};
