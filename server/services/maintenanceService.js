
const mongoose = require("mongoose");
const Maintenance = require("../models/Maintenance");
const Equipment = require("../models/Equipment");
const User = require("../models/User");

class MaintenanceServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const statutsAutorises = [
  "Planifiée",
  "En cours",
  "Terminée",
  "Annulée"
];

const typesAutorises = [
  "Préventive",
  "Corrective"
];

const validObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const validMaintenanceId = (id) =>
  Number.isSafeInteger(Number(id)) && Number(id) >= 1;

// Vérifier l'existence de l'équipement
const verifierEquipement = async (equipmentId) => {
  if (!validObjectId(equipmentId)) {
    throw new MaintenanceServiceError(
      "Identifiant d'équipement invalide",
      400
    );
  }

  const equipement = await Equipment.findById(equipmentId);

  if (!equipement) {
    throw new MaintenanceServiceError(
      "Équipement introuvable",
      404
    );
  }

  return equipement;
};

// Vérifier l'existence et le rôle du technicien
const verifierTechnicien = async (technicianId) => {
  if (!validObjectId(technicianId)) {
    throw new MaintenanceServiceError(
      "Identifiant de technicien invalide",
      400
    );
  }

  const technicien = await User.findById(technicianId);

  if (!technicien) {
    throw new MaintenanceServiceError(
      "Technicien introuvable",
      404
    );
  }

  if (!technicien.isActive) {
    throw new MaintenanceServiceError(
      "Ce compte technicien est désactivé",
      400
    );
  }

  if (technicien.role !== "technician") {
    throw new MaintenanceServiceError(
      "L'utilisateur sélectionné n'est pas un technicien",
      400
    );
  }

  return technicien;
};

// Récupérer une maintenance avec ses références
const obtenirMaintenance = async (id) => {
  if (!validMaintenanceId(id)) {
    throw new MaintenanceServiceError(
      "Identifiant de maintenance invalide",
      400
    );
  }

  const maintenance = await Maintenance.findById(Number(id))
    .populate(
      "equipmentId",
      "name serialNumber brand model status"
    )
    .populate(
      "technicianId",
      "matricule firstName lastName role"
    );

  if (!maintenance) {
    throw new MaintenanceServiceError(
      "Maintenance introuvable",
      404
    );
  }

  return maintenance;
};

// Créer une maintenance
const creerMaintenance = async (data) => {
  const equipement = await verifierEquipement(data.equipmentId);

  await verifierTechnicien(data.technicianId);

  if (equipement.status === "Assigned") {
    throw new MaintenanceServiceError(
      "Impossible de planifier une maintenance sur un équipement affecté",
      400
    );
  }

  if (equipement.status === "Retired") {
    throw new MaintenanceServiceError(
      "Impossible de planifier une maintenance sur un équipement retiré",
      400
    );
  }

  if (
    data.typeMaintenance &&
    !typesAutorises.includes(data.typeMaintenance)
  ) {
    throw new MaintenanceServiceError(
      "Type de maintenance invalide",
      400
    );
  }

  if (
    data.statut &&
    !statutsAutorises.includes(data.statut)
  ) {
    throw new MaintenanceServiceError(
      "Statut de maintenance invalide",
      400
    );
  }

  const statut = data.statut || "Planifiée";

  if (
    statut === "En cours" &&
    equipement.status !== "Available" &&
    equipement.status !== "Maintenance"
  ) {
    throw new MaintenanceServiceError(
      "Cet équipement n'est pas disponible pour une maintenance",
      400
    );
  }

  // Créer d'abord la maintenance
  const maintenance = await Maintenance.create(data);

  // Modifier le statut de l'équipement après la création
  if (statut === "En cours") {
    equipement.status = "Maintenance";
    await equipement.save();
  }

  return maintenance;
};

// Lister les maintenances avec filtres et pagination
const obtenirMaintenances = async (filters = {}) => {
  const page = Math.max(
    1,
    Number.parseInt(filters.page, 10) || 1
  );

  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(filters.limit, 10) || 10)
  );

  const query = {};

  if (filters.statut) {
    if (!statutsAutorises.includes(filters.statut)) {
      throw new MaintenanceServiceError(
        "Statut de maintenance invalide",
        400
      );
    }

    query.statut = filters.statut;
  }

  if (filters.typeMaintenance) {
    if (!typesAutorises.includes(filters.typeMaintenance)) {
      throw new MaintenanceServiceError(
        "Type de maintenance invalide",
        400
      );
    }

    query.typeMaintenance = filters.typeMaintenance;
  }

  if (filters.equipmentId) {
    if (!validObjectId(filters.equipmentId)) {
      throw new MaintenanceServiceError(
        "Identifiant d'équipement invalide",
        400
      );
    }

    query.equipmentId = filters.equipmentId;
  }

  if (filters.technicianId) {
    if (!validObjectId(filters.technicianId)) {
      throw new MaintenanceServiceError(
        "Identifiant de technicien invalide",
        400
      );
    }

    query.technicianId = filters.technicianId;
  }

  const [maintenances, total] = await Promise.all([
    Maintenance.find(query)
      .populate(
        "equipmentId",
        "name serialNumber brand model status"
      )
      .populate(
        "technicianId",
        "matricule firstName lastName"
      )
      .sort({ dateMaintenance: -1 })
      .skip((page - 1) * limit)
      .limit(limit),

    Maintenance.countDocuments(query)
  ]);

  return {
    maintenances,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// Consulter une maintenance
const obtenirMaintenanceParId = async (id) => {
  return obtenirMaintenance(id);
};

// Modifier une maintenance
const modifierMaintenance = async (id, data) => {
  if (!validMaintenanceId(id)) {
    throw new MaintenanceServiceError(
      "Identifiant de maintenance invalide",
      400
    );
  }

  const maintenance = await Maintenance.findById(Number(id));

  if (!maintenance) {
    throw new MaintenanceServiceError(
      "Maintenance introuvable",
      404
    );
  }

  const equipement = await verifierEquipement(
    maintenance.equipmentId
  );

  const champsAutorises = [
    "typeMaintenance",
    "description",
    "dateMaintenance",
    "cout",
    "statut",
    "resultat",
    "prochaineDateMaintenance"
  ];

  if (
    data.typeMaintenance !== undefined &&
    !typesAutorises.includes(data.typeMaintenance)
  ) {
    throw new MaintenanceServiceError(
      "Type de maintenance invalide",
      400
    );
  }

  if (
    data.statut !== undefined &&
    !statutsAutorises.includes(data.statut)
  ) {
    throw new MaintenanceServiceError(
      "Statut de maintenance invalide",
      400
    );
  }

  const ancienStatut = maintenance.statut;

  for (const champ of champsAutorises) {
    if (data[champ] !== undefined) {
      maintenance[champ] = data[champ];
    }
  }

  // Démarrage de la maintenance
  if (
    maintenance.statut === "En cours" &&
    ancienStatut !== "En cours"
  ) {
    if (
      equipement.status !== "Available" &&
      equipement.status !== "Maintenance"
    ) {
      throw new MaintenanceServiceError(
        "Cet équipement n'est pas disponible pour une maintenance",
        400
      );
    }

    equipement.status = "Maintenance";
    await equipement.save();
  }

  // Fin ou annulation de la maintenance
  if (
    ancienStatut === "En cours" &&
    maintenance.statut !== "En cours"
  ) {
    const autreMaintenanceEnCours = await Maintenance.exists({
      _id: { $ne: maintenance._id },
      equipmentId: maintenance.equipmentId,
      statut: "En cours"
    });

    if (!autreMaintenanceEnCours) {
      equipement.status = "Available";
      await equipement.save();
    }
  }

  await maintenance.save();

  return obtenirMaintenance(maintenance._id);
};

// Supprimer une maintenance
const supprimerMaintenance = async (id) => {
  if (!validMaintenanceId(id)) {
    throw new MaintenanceServiceError(
      "Identifiant de maintenance invalide",
      400
    );
  }

  const maintenance = await Maintenance.findById(Number(id));

  if (!maintenance) {
    throw new MaintenanceServiceError(
      "Maintenance introuvable",
      404
    );
  }

  if (maintenance.statut === "En cours") {
    throw new MaintenanceServiceError(
      "Impossible de supprimer une maintenance en cours",
      400
    );
  }

  await maintenance.deleteOne();
};

module.exports = {
  MaintenanceServiceError,
  creerMaintenance,
  obtenirMaintenances,
  obtenirMaintenanceParId,
  modifierMaintenance,
  supprimerMaintenance
};
