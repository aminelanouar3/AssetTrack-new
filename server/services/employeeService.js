
const mongoose = require("mongoose");
const Employee = require("../models/Employee");
const Equipment = require("../models/Equipment");

class EmployeeServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const validId = (id) => mongoose.isValidObjectId(id);

const validateEmployeeData = (data, partial = false) => {
  const requiredFields = ["matricule", "firstName", "lastName", "department", "position"];

  for (const field of requiredFields) {
    if (!partial || data[field] !== undefined) {
      const value = data[field];

      if (typeof value !== "string" || !value.trim()) {
        throw new EmployeeServiceError(`${field} is required`, 400);
      }
    }
  }

  if (data.matricule !== undefined && !/^\d{8}$/.test(data.matricule)) {
    throw new EmployeeServiceError(
      "Matricule must contain exactly 8 digits",
      400
    );
  }
};

const createEmployee = async (data) => {
  validateEmployeeData(data);

  return Employee.create({
    matricule: data.matricule.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    department: data.department.trim(),
    position: data.position.trim()
  });
};

const getEmployees = async (filters = {}) => {
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(filters.limit, 10) || 10));

  const query = {};

  if (filters.department) {
    query.department = filters.department.trim();
  }

  if (filters.q && filters.q.trim()) {
    const search = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(search, "i");

    query.$or = [
      { matricule: regex },
      { firstName: regex },
      { lastName: regex },
      { department: regex },
      { position: regex }
    ];
  }

  const [employees, total] = await Promise.all([
    Employee.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Employee.countDocuments(query)
  ]);

  return {
    employees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getEmployeeById = async (id) => {
  if (!validId(id)) {
    throw new EmployeeServiceError("Invalid employee ID", 400);
  }

  const employee = await Employee.findById(id);

  if (!employee) {
    throw new EmployeeServiceError("Employee not found", 404);
  }

  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await getEmployeeById(id);

  validateEmployeeData(data, true);

  const allowedFields = [
    "matricule",
    "firstName",
    "lastName",
    "department",
    "position"
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      employee[field] = data[field].trim();
    }
  }

  await employee.save();
  return employee;
};

const deleteEmployee = async (id) => {
  const employee = await getEmployeeById(id);

  const equipmentReference = await Equipment.exists({
    $or: [
      { currentEmployeeId: employee._id },
      { "assignmentHistory.employeeId": employee._id }
    ]
  });

  if (equipmentReference) {
    throw new EmployeeServiceError(
      "Cannot delete an employee referenced by equipment or assignment history",
      400
    );
  }

  await employee.deleteOne();
};

module.exports = {
  EmployeeServiceError,
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
