
const maintenanceService = require("../services/maintenanceService");

const handleError = (res, error) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Un enregistrement avec ces informations existe déjà"
    });
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      message: error.message
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Erreur interne du serveur"
  });
};

// POST /api/maintenances
const creerMaintenance = async (req, res) => {
  try {
    const maintenance =
      await maintenanceService.creerMaintenance(req.body);

    return res.status(201).json({
      message: "Maintenance créée avec succès",
      maintenance
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/maintenances
const obtenirMaintenances = async (req, res) => {
  try {
    const result =
      await maintenanceService.obtenirMaintenances(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/maintenances/:id
const obtenirMaintenanceParId = async (req, res) => {
  try {
    const maintenance =
      await maintenanceService.obtenirMaintenanceParId(req.params.id);

    return res.status(200).json({ maintenance });
  } catch (error) {
    return handleError(res, error);
  }
};

// PUT /api/maintenances/:id
const modifierMaintenance = async (req, res) => {
  try {
    const maintenance =
      await maintenanceService.modifierMaintenance(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      message: "Maintenance modifiée avec succès",
      maintenance
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/maintenances/:id
const supprimerMaintenance = async (req, res) => {
  try {
    await maintenanceService.supprimerMaintenance(req.params.id);

    return res.status(200).json({
      message: "Maintenance supprimée avec succès"
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const obtenirStatistiquesCouts = async (req, res) => {
  try {
    const statistiques =
      await maintenanceService.obtenirStatistiquesCouts();

    return res.status(200).json({
      message: "Statistiques des coûts récupérées avec succès",
      statistiques
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du calcul des statistiques des coûts"
    });
  }
};

const obtenirStatistiquesMaintenances = async (req, res) => {
  try {
    const statistiques =
      await maintenanceService.obtenirStatistiquesMaintenances();

    return res.status(200).json({
      message: "Statistiques des maintenances récupérées avec succès",
      statistiques
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur lors du calcul des statistiques des maintenances"
    });
  }
};

module.exports = {
  creerMaintenance,
  obtenirMaintenances,
  obtenirMaintenanceParId,
  modifierMaintenance,
  supprimerMaintenance,
  obtenirStatistiquesCouts,
  obtenirStatistiquesMaintenances
};
