
const employeeService = require("../services/employeeService");

const handleError = (res, error, operation) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "An employee with this matricule already exists"
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
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

const createEmployee = async (req, res) => {
  try {
    const employee = await employeeService.createEmployee(req.body);

    return res.status(201).json({
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    return handleError(res, error, "creating employee");
  }
};

const getEmployees = async (req, res) => {
  try {
    const result = await employeeService.getEmployees(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "retrieving employees");
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    return res.status(200).json({ employee });
  } catch (error) {
    return handleError(res, error, "retrieving employee");
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.updateEmployee(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      message: "Employee updated successfully",
      employee
    });
  } catch (error) {
    return handleError(res, error, "updating employee");
  }
};

const deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.id);

    return res.status(200).json({
      message: "Employee deleted successfully"
    });
  } catch (error) {
    return handleError(res, error, "deleting employee");
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
