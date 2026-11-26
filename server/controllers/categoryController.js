
const categoryService = require("../services/categoryService");

const handleError = (res, error, operation) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A category with this name already exists"
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

const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);

    return res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    return handleError(res, error, "creating category");
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getCategories();

    return res.status(200).json({
      count: categories.length,
      categories
    });
  } catch (error) {
    return handleError(res, error, "retrieving categories");
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    return res.status(200).json({ category });
  } catch (error) {
    return handleError(res, error, "retrieving category");
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    return handleError(res, error, "updating category");
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);

    return res.status(200).json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    return handleError(res, error, "deleting category");
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
