
const equipmentService = require("../services/equipmentService");

const handleError = (res, error, operation) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "An equipment record with this serial number already exists"
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(`${operation} error:`, error);

  return res.status(500).json({
    message: `Server error while ${operation}`
  });
};

const createEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.createEquipment(req.body);

    return res.status(201).json({
      message: "Equipment created successfully",
      equipment
    });
  } catch (error) {
    return handleError(res, error, "creating equipment");
  }
};

const getEquipment = async (req, res) => {
  try {
    const result = await equipmentService.getEquipment(req.query);

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "retrieving equipment");
  }
};

const getEquipmentById = async (req, res) => {
  try {
    const equipment = await equipmentService.getEquipmentById(req.params.id);

    return res.status(200).json({ equipment });
  } catch (error) {
    return handleError(res, error, "retrieving equipment");
  }
};

const updateEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.updateEquipment(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      message: "Equipment updated successfully",
      equipment
    });
  } catch (error) {
    return handleError(res, error, "updating equipment");
  }
};

const deleteEquipment = async (req, res) => {
  try {
    await equipmentService.deleteEquipment(req.params.id);

    return res.status(200).json({
      message: "Equipment deleted successfully"
    });
  } catch (error) {
    return handleError(res, error, "deleting equipment");
  }
};

const assignEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.assignEquipment(
      req.params.id,
      req.body.employeeId,
      req.body.notes
    );

    return res.status(200).json({
      message: "Equipment assigned successfully",
      equipment
    });
  } catch (error) {
    return handleError(res, error, "assigning equipment");
  }
};

const returnEquipment = async (req, res) => {
  try {
    const equipment = await equipmentService.returnEquipment(
      req.params.id,
      req.body.notes
    );

    return res.status(200).json({
      message: "Equipment returned successfully",
      equipment
    });
  } catch (error) {
    return handleError(res, error, "returning equipment");
  }
};

module.exports = {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  assignEquipment,
  returnEquipment
};
