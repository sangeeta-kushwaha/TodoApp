import Todo from "../models/todo.model.js";

const createTodo = async (req, res) => {
  try {
    const { title, description } = req.body;
    const todo = await Todo.create({
      title,
      description,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: todo,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create todo",
      error: err.message,
    });
  }
};

const getTodos = async (req, res) => {
  try {
    console.log("req.user.id", req.user.id);

    const todos = await Todo.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    console.log("todos", todos);

    return res.status(200).json({
      success: true,
      message: "Todos fetched successfully",
      data: todos,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get todos",
      error: err.message,
    });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const updatedFields = {};
    if (title) updatedFields.title = title;
    if (description) updatedFields.description = description;
    if (completed !== undefined) updatedFields.completed = completed;

    const todo = await Todo.findOneAndUpdate(
      { _id: id, user: req.user.id },
      updatedFields,
      { returnDocument: "after" },
    );

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo updated successfully",
      data: todo,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update todo",
      error: err.message,
    });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: "Todo not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete todo",
      error: err.message,
    });
  }
};

export { createTodo, getTodos, updateTodo, deleteTodo };
