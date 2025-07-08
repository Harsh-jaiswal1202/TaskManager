import Task from "../models/Task.js";
import Category from "../models/Category.js";

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find(); // fetches all documents from the 'categories' collection
    res.status(200).json(categories); // send them as JSON
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories", error });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, emoji, color } = req.body;
    const category = await Category.create({ name, emoji, color });
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

    const category = await Category.findById(id).populate("tasks");

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
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
