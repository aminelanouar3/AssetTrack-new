
const userService = require("../services/userService");

const handleError = (res, error, operation) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "This matricule is already used by another user"
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  console.error(`${operation} error:`, error);

  return res.status(500).json({
    message: `Server error while ${operation}`
  });
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);

    return res.status(201).json({
      message: "User created successfully",
      user
    });
  } catch (error) {
    return handleError(res, error, "creating user");
  }
};

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    return handleError(res, error, "retrieving users");
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({ user });
  } catch (error) {
    return handleError(res, error, "retrieving user");
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    return handleError(res, error, "updating user");
  }
};

// PATCH /api/users/:id/status
const updateUserStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(
      req.params.id,
      req.body.isActive,
      req.user
    );

    return res.status(200).json({
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user
    });
  } catch (error) {
    return handleError(res, error, "updating user status");
  }
};

// PATCH /api/users/:id/reset-password
const resetUserPassword = async (req, res) => {
  try {
    await userService.resetUserPassword(
      req.params.id,
      req.body.newPassword
    );

    return res.status(200).json({
      message: "User password reset successfully"
    });
  } catch (error) {
    return handleError(res, error, "resetting password");
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
