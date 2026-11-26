
const mongoose = require("mongoose");
const Equipment = require("../models/Equipment");
const Category = require("../models/Category");
const Employee = require("../models/Employee");

class EquipmentServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const validId = (id) => mongoose.isValidObjectId(id);

const validateCategory = async (categoryId) => {
  if (!validId(categoryId)) {
    throw new EquipmentServiceError("Invalid category ID", 400);
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new EquipmentServiceError("Category not found", 404);
  }
};

const createEquipment = async (data) => {
  await validateCategory(data.categoryId);

  return Equipment.create(data);
};

const getEquipment = async (filters = {}) => {
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(filters.limit, 10) || 10));

  const query = {};

  if (filters.status) {
    const allowedStatuses = ["Available", "Assigned", "Maintenance", "Retired"];

    if (!allowedStatuses.includes(filters.status)) {
      throw new EquipmentServiceError("Invalid equipment status", 400);
    }

    query.status = filters.status;
  }

  if (filters.categoryId) {
    if (!validId(filters.categoryId)) {
      throw new EquipmentServiceError("Invalid category ID", 400);
    }

    query.categoryId = filters.categoryId;
  }

  if (filters.q && filters.q.trim()) {
    query.$text = { $search: filters.q.trim() };
  }

  const sort = query.$text
    ? { score: { $meta: "textScore" } }
    : { createdAt: -1 };

  const [equipment, total] = await Promise.all([
    Equipment.find(query)
      .populate("categoryId", "name description")
      .populate("currentEmployeeId", "matricule firstName lastName department")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Equipment.countDocuments(query)
  ]);

  return {
    equipment,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getEquipmentById = async (id) => {
  if (!validId(id)) {
    throw new EquipmentServiceError("Invalid equipment ID", 400);
  }

  const equipment = await Equipment.findById(id)
    .populate("categoryId", "name description")
    .populate("currentEmployeeId", "matricule firstName lastName department")
    .populate("assignmentHistory.employeeId", "matricule firstName lastName");

  if (!equipment) {
    throw new EquipmentServiceError("Equipment not found", 404);
  }

  return equipment;
};

const updateEquipment = async (id, data) => {
  const equipment = await getEquipmentById(id);

  const allowedFields = [
    "name",
    "serialNumber",
    "brand",
    "model",
    "categoryId",
    "specifications",
    "status",
    "purchasePrice",
    "purchaseDate",
    "warrantyEndDate",
    "tags"
  ];

  if (data.categoryId !== undefined) {
    await validateCategory(data.categoryId);
  }

  if (data.status !== undefined) {
    const allowedStatuses = ["Available", "Maintenance", "Retired"];

    if (!allowedStatuses.includes(data.status)) {
      throw new EquipmentServiceError(
        "Use the assignment and return endpoints to manage the Assigned status",
        400
      );
    }

    if (equipment.status === "Assigned") {
      throw new EquipmentServiceError(
        "Return the equipment before changing its status",
        400
      );
    }
  }

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      equipment[field] = data[field];
    }
  }

  await equipment.save();
  return equipment;
};

const deleteEquipment = async (id) => {
  const equipment = await getEquipmentById(id);

  if (equipment.status === "Assigned") {
    throw new EquipmentServiceError(
      "Return the equipment before deleting it",
      400
    );
  }

  await equipment.deleteOne();
};

const assignEquipment = async (id, employeeId, notes = "") => {
  if (!validId(id)) {
    throw new EquipmentServiceError("Invalid equipment ID", 400);
  }

  if (!validId(employeeId)) {
    throw new EquipmentServiceError("Invalid employee ID", 400);
  }

  const [equipment, employee] = await Promise.all([
    Equipment.findById(id),
    Employee.findById(employeeId)
  ]);

  if (!equipment) {
    throw new EquipmentServiceError("Equipment not found", 404);
  }

  if (!employee) {
    throw new EquipmentServiceError("Employee not found", 404);
  }

  if (equipment.status !== "Available") {
    throw new EquipmentServiceError(
      "Only available equipment can be assigned",
      400
    );
  }

  equipment.status = "Assigned";
  equipment.currentEmployeeId = employee._id;

  equipment.assignmentHistory.push({
    employeeId: employee._id,
    assignedAt: new Date(),
    notes: typeof notes === "string" ? notes.trim() : ""
  });

  await equipment.save();
  return equipment;
};

const returnEquipment = async (id, notes = "") => {
  if (!validId(id)) {
    throw new EquipmentServiceError("Invalid equipment ID", 400);
  }

  const equipment = await Equipment.findById(id);

  if (!equipment) {
    throw new EquipmentServiceError("Equipment not found", 404);
  }

  if (equipment.status !== "Assigned") {
    throw new EquipmentServiceError("Equipment is not currently assigned", 400);
  }

  const activeAssignment = [...equipment.assignmentHistory]
    .reverse()
    .find((assignment) => !assignment.returnedAt);

  if (!activeAssignment) {
    throw new EquipmentServiceError(
      "No active assignment was found in the history",
      400
    );
  }

  activeAssignment.returnedAt = new Date();

  if (typeof notes === "string" && notes.trim()) {
    activeAssignment.notes = activeAssignment.notes
      ? `${activeAssignment.notes} | Return: ${notes.trim()}`
      : `Return: ${notes.trim()}`;
  }

  equipment.status = "Available";
  equipment.currentEmployeeId = null;

  await equipment.save();
  return equipment;
};

module.exports = {
  EquipmentServiceError,
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  assignEquipment,
  returnEquipment
};
