
require("dotenv").config();

const mongoose = require("mongoose");

const Category = require("../models/Category");
const Employee = require("../models/Employee");
const User = require("../models/User");
const Equipment = require("../models/Equipment");
const Maintenance = require("../models/Maintenance");

const TARGET_EQUIPMENT = 10000;
const TARGET_MAINTENANCE = 2000;

const categoriesData = [
  { name: "Ordinateurs", description: "Ordinateurs fixes et portables" },
  { name: "Serveurs", description: "Serveurs physiques et équipements associés" },
  { name: "Réseau", description: "Routeurs, switchs et points d'accès" },
  { name: "Imprimantes", description: "Imprimantes et scanners" },
  { name: "Stockage", description: "Disques et systèmes de stockage" },
  { name: "Téléphonie", description: "Téléphones et équipements mobiles" },
  { name: "Sécurité", description: "Caméras et équipements de sécurité" },
  { name: "Périphériques", description: "Claviers, souris et écrans" }
];

const departments = [
  "Informatique",
  "Comptabilité",
  "Ressources humaines",
  "Administration",
  "Commercial",
  "Production",
  "Logistique",
  "Direction"
];

const positions = [
  "Technicien",
  "Administrateur",
  "Responsable",
  "Ingénieur",
  "Assistant",
  "Analyste"
];

const firstNames = [
  "Ahmed", "Mohamed", "Ali", "Youssef", "Amine",
  "Sami", "Karim", "Omar", "Hassan", "Walid",
  "Nour", "Salma", "Meriem", "Sarra", "Ines"
];

const lastNames = [
  "Ben Ali", "Trabelsi", "Mansouri", "Gharbi",
  "Jaziri", "Bouzid", "Khelifi", "Saidi",
  "Hamdi", "Ayari", "Chaabane", "Marzouki"
];

const equipmentTemplates = [
  {
    name: "Ordinateur portable",
    brands: ["Dell", "HP", "Lenovo", "Asus"],
    models: ["Latitude", "EliteBook", "ThinkPad", "ExpertBook"],
    specifications: {
      processor: "Intel Core i7",
      ram: "16 GB",
      storage: "512 GB SSD"
    }
  },
  {
    name: "Ordinateur de bureau",
    brands: ["Dell", "HP", "Lenovo"],
    models: ["OptiPlex", "ProDesk", "ThinkCentre"],
    specifications: {
      processor: "Intel Core i5",
      ram: "8 GB",
      storage: "256 GB SSD"
    }
  },
  {
    name: "Serveur",
    brands: ["Dell", "HP", "IBM"],
    models: ["PowerEdge", "ProLiant", "System x"],
    specifications: {
      processor: "Intel Xeon",
      ram: "64 GB",
      storage: "2 TB"
    }
  },
  {
    name: "Routeur",
    brands: ["Cisco", "TP-Link", "MikroTik"],
    models: ["ISR", "Archer", "RouterBOARD"],
    specifications: {
      ports: 8,
      network: "Gigabit Ethernet"
    }
  },
  {
    name: "Imprimante",
    brands: ["HP", "Canon", "Epson"],
    models: ["LaserJet", "ImageCLASS", "EcoTank"],
    specifications: {
      technology: "Laser",
      connectivity: "USB / Wi-Fi"
    }
  },
  {
    name: "Switch réseau",
    brands: ["Cisco", "HP", "D-Link"],
    models: ["Catalyst", "Aruba", "DGS"],
    specifications: {
      ports: 24,
      network: "Gigabit Ethernet"
    }
  },
  {
    name: "Écran",
    brands: ["Dell", "Samsung", "LG"],
    models: ["UltraSharp", "Business", "UltraWide"],
    specifications: {
      resolution: "1920x1080",
      size: "24 pouces"
    }
  },
  {
    name: "Scanner",
    brands: ["Canon", "Epson", "Brother"],
    models: ["ScanJet", "WorkForce", "ADS"],
    specifications: {
      resolution: "1200 dpi",
      connectivity: "USB"
    }
  }
];

const randomItem = (array) =>
  array[Math.floor(Math.random() * array.length)];

const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const roundPrice = (min, max) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const generateMatricule = (number) =>
  String(number).padStart(8, "0");

async function createCategories() {
  console.log("Création des catégories...");

  for (const category of categoriesData) {
    await Category.updateOne(
      { name: category.name },
      { $setOnInsert: category },
      { upsert: true }
    );
  }

  return Category.find();
}

async function createEmployees() {
  console.log("Création des employés...");

  for (let i = 1; i <= 100; i++) {
    const matricule = generateMatricule(70000000 + i);

    await Employee.updateOne(
      { matricule },
      {
        $setOnInsert: {
          matricule,
          firstName: randomItem(firstNames),
          lastName: randomItem(lastNames),
          department: randomItem(departments),
          position: randomItem(positions)
        }
      },
      { upsert: true }
    );
  }

  return Employee.find();
}

async function createEquipment(categories, employees) {
  console.log("Vérification des équipements...");

  const existingCount = await Equipment.countDocuments();

  if (existingCount >= TARGET_EQUIPMENT) {
    console.log(`${existingCount} équipements existent déjà. Génération ignorée.`);
    return;
  }

  const existingSerials = await Equipment.distinct("serialNumber");

  const existingSet = new Set(existingSerials);

  const equipmentData = [];

  const startDate = new Date("2022-01-01");
  const endDate = new Date();

  for (let i = 1; i <= TARGET_EQUIPMENT; i++) {
    const serialNumber = `AST-${String(i).padStart(6, "0")}`;

    if (existingSet.has(serialNumber)) {
      continue;
    }

    const template = randomItem(equipmentTemplates);
    const category = randomItem(categories);
    const assigned = Math.random() < 0.45;
    const status = assigned
      ? "Assigned"
      : randomItem(["Available", "Available", "Maintenance", "Retired"]);

    const employee = assigned ? randomItem(employees) : null;

    const purchaseDate = randomDate(startDate, endDate);

    const assignmentHistory = assigned
      ? [{
          employeeId: employee._id,
          assignedAt: randomDate(purchaseDate, endDate),
          returnedAt: null,
          notes: "Affectation initiale"
        }]
      : [];

    equipmentData.push({
      name: template.name,
      serialNumber,
      brand: randomItem(template.brands),
      model: randomItem(template.models),
      categoryId: category._id,
      specifications: template.specifications,
      status,
      purchasePrice: roundPrice(150, 12000),
      purchaseDate,
      warrantyEndDate: new Date(
        purchaseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000
      ),
      currentEmployeeId: employee ? employee._id : null,
      tags: [
        randomItem(["Professionnel", "Standard", "Entreprise"]),
        randomItem(["Informatique", "Bureau", "Technique"])
      ],
      assignmentHistory
    });
  }

  console.log(`Insertion de ${equipmentData.length} équipements...`);

  for (let i = 0; i < equipmentData.length; i += 1000) {
    await Equipment.insertMany(equipmentData.slice(i, i + 1000));
    console.log(
      `${Math.min(i + 1000, equipmentData.length)} / ${equipmentData.length} équipements traités`
    );
  }
}

async function createMaintenances(technicians) {
  console.log("Vérification des maintenances...");

  const existingCount = await Maintenance.countDocuments();

  if (existingCount >= TARGET_MAINTENANCE) {
    console.log(`${existingCount} maintenances existent déjà. Génération ignorée.`);
    return;
  }

  const missingCount = TARGET_MAINTENANCE - existingCount;

  const equipment = await Equipment.find({
    status: { $ne: "Retired" }
  }).select("_id");

  if (equipment.length === 0) {
    throw new Error("Aucun équipement disponible pour les maintenances.");
  }

  const now = new Date();
  const startDate = new Date("2023-01-01");

  // Synchronisation du compteur avec les identifiants déjà utilisés.
  const lastMaintenance = await Maintenance.findOne()
    .sort({ _id: -1 })
    .select("_id")
    .lean();

  const lastId = lastMaintenance ? lastMaintenance._id : 0;

  const counterCollection = mongoose.connection.collection("counters");

  const counter = await counterCollection.findOneAndUpdate(
    { _id: "maintenance" },
    { $max: { seq: lastId } },
    { upsert: true, returnDocument: "after" }
  );

  const currentSeq = counter.seq;

  const updatedCounter = await counterCollection.findOneAndUpdate(
    { _id: "maintenance" },
    { $inc: { seq: missingCount } },
    { returnDocument: "after" }
  );

  const firstId = updatedCounter.seq - missingCount + 1;

  const maintenanceData = [];

  for (let i = 0; i < missingCount; i++) {
    const selectedEquipment = randomItem(equipment);
    const technician = randomItem(technicians);

    const dateMaintenance = randomDate(startDate, now);

    const typeMaintenance = randomItem([
      "Préventive",
      "Corrective"
    ]);

    const statut = randomItem([
      "Planifiée",
      "Terminée",
      "Terminée",
      "Annulée"
    ]);

    maintenanceData.push({
      _id: firstId + i,
      equipmentId: selectedEquipment._id,
      technicianId: technician._id,
      typeMaintenance,
      description: typeMaintenance === "Préventive"
        ? "Contrôle et entretien périodique de l'équipement"
        : "Intervention corrective suite à un problème technique",
      dateMaintenance,
      cout: roundPrice(20, 1500),
      statut,
      resultat: statut === "Terminée"
        ? "Intervention effectuée avec succès"
        : "",
      prochaineDateMaintenance: statut === "Terminée"
        ? new Date(dateMaintenance.getTime() + 180 * 24 * 60 * 60 * 1000)
        : null
    });
  }

  console.log(`Insertion de ${maintenanceData.length} maintenances...`);

  for (let i = 0; i < maintenanceData.length; i += 500) {
    await Maintenance.insertMany(maintenanceData.slice(i, i + 500));
    console.log(
      `${Math.min(i + 500, maintenanceData.length)} / ${maintenanceData.length} maintenances traitées`
    );
  }
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connecté :", mongoose.connection.name);

    const technicians = await User.find({
      role: "technician",
      isActive: true
    });

    if (technicians.length === 0) {
      throw new Error(
        "Aucun technicien actif trouvé. Crée au moins un compte technicien avant de lancer le script."
      );
    }

    const categories = await createCategories();
    const employees = await createEmployees();

    await createEquipment(categories, employees);
    await createMaintenances(technicians);

    console.log("\nGénération terminée !");

    console.log("Catégories :", await Category.countDocuments());
    console.log("Employés :", await Employee.countDocuments());
    console.log("Équipements :", await Equipment.countDocuments());
    console.log("Maintenances :", await Maintenance.countDocuments());
    console.log("Utilisateurs conservés :", await User.countDocuments());

  } catch (error) {
    console.error("Erreur pendant la génération :", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
