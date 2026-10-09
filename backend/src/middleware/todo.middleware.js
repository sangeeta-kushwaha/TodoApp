const validateTodo = (req, res, next) => {
  const { title, description } = req.body;
  const isUpdate = req.method === "PUT";

  if (!isUpdate || title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (title.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }
  }

  if (!isUpdate || description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }
    if (description.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Description must be at least 3 characters long" });
    }
  }

  next();
};

export default validateTodo;
