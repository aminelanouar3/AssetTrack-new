
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Equipment = require("../models/Equipment");

class CategoryServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const createCategory = async (data) => {
  const { name, description = "" } = data;

  if (typeof name !== "string" || !name.trim()) {
    throw new CategoryServiceError("Category name is required", 400);
  }

  return Category.create({
    name: name.trim(),
    description
  });
};

const getCategories = async () => {
  return Category.find().sort({ name: 1 });
};

const getCategoryById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new CategoryServiceError("Invalid category ID", 400);
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new CategoryServiceError("Category not found", 404);
  }

  return category;
};

const updateCategory = async (id, data) => {
  const category = await getCategoryById(id);

  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw new CategoryServiceError("Category name cannot be empty", 400);
    }

    category.name = data.name.trim();
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") {
      throw new CategoryServiceError("Description must be a string", 400);
    }

    category.description = data.description.trim();
  }

  await category.save();
  return category;
};

const deleteCategory = async (id) => {
  const category = await getCategoryById(id);

  const equipmentCount = await Equipment.countDocuments({
    categoryId: category._id
  });

  if (equipmentCount > 0) {
    throw new CategoryServiceError(
      "Cannot delete a category that is used by equipment",
      400
    );
  }

  await category.deleteOne();
};

module.exports = {
  CategoryServiceError,
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
