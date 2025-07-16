import Task from "../models/Task.js";
import Category from "../models/Category.js";

const getAllCategories = async (req, res) => {
  try {
    const { batchId } = req.query;
    const filter = batchId ? { batch: batchId } : {};
    const categories = await Category.find(filter);
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories", error });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, emoji, color, batch } = req.body;
    if (!batch) {
      return res.status(400).json({ message: "Batch is required for category" });
    }
    const category = await Category.create({ name, emoji, color, batch });
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Failed to create category", error });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category", error });
  }
};

const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emoji, color } = req.body;
    const category = await Category.findByIdAndUpdate(
      id,
      { name, emoji, color },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error editing category:", error);
    res.status(500).json({ message: "Failed to edit category", error });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { batchId } = req.query;
    const category = await Category.findById(id).populate("tasks");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    if (batchId && String(category.batch) !== String(batchId)) {
      return res.status(403).json({ message: "Category does not belong to this batch" });
    }
    res.status(200).json(category);
  } catch (error) {
    console.error("Error fetching category and tasks:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch category and tasks", error });
  }
};

export {
  getAllCategories,
  createCategory,
  deleteCategory,
  editCategory,
  getAllTasks,
};
