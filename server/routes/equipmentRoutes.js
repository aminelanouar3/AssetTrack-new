
const express = require("express");
const router = express.Router();

const {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  assignEquipment,
  returnEquipment,
  getEquipmentStatistics
} = require("../controllers/equipmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "technician"));

router.route("/")
  .post(createEquipment)
  .get(getEquipment);

router.get("/search", getEquipment);
router.get("/statistics", getEquipmentStatistics);

router.route("/:id")
  .get(getEquipmentById)
  .put(updateEquipment)
  .delete(deleteEquipment);

router.patch("/:id/assign", assignEquipment);
router.patch("/:id/return", returnEquipment);

module.exports = router;
