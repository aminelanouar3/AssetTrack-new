
const express = require("express");
const router = express.Router();

const {
  creerMaintenance,
  obtenirMaintenances,
  obtenirMaintenanceParId,
  modifierMaintenance,
  supprimerMaintenance
} = require("../controllers/maintenanceController");

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "technician"));

router.route("/")
  .post(creerMaintenance)
  .get(obtenirMaintenances);

router.route("/:id")
  .get(obtenirMaintenanceParId)
  .put(modifierMaintenance)
  .delete(supprimerMaintenance);

module.exports = router;
