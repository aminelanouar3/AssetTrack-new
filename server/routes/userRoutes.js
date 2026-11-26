
const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword
} = require("../controllers/userController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.route("/")
  .post(createUser)
  .get(getUsers);

router.route("/:id")
  .get(getUserById)
  .put(updateUser);

router.patch("/:id/status", updateUserStatus);
router.patch("/:id/reset-password", resetUserPassword);

module.exports = router;
