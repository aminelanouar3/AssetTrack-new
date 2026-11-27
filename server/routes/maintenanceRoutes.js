const express = require("express");
const router = express.Router();

const {
  creerMaintenance,
  obtenirMaintenances,
  obtenirMaintenanceParId,
  modifierMaintenance,
  supprimerMaintenance,
  obtenirStatistiquesCouts,
  obtenirStatistiquesMaintenances
} = require("../controllers/maintenanceController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin", "technician"));

router.route("/")
  .post(creerMaintenance)
  .get(obtenirMaintenances);

// Statistiques
router.get("/statistics/costs", obtenirStatistiquesCouts);
router.get("/statistics", obtenirStatistiquesMaintenances);

// CRUD
router.route("/:id")
  .get(obtenirMaintenanceParId)
  .put(modifierMaintenance)
  .delete(supprimerMaintenance);

module.exports = router;