import { FaCheck } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import { FiEdit2 } from "react-icons/fi";
import api from "../services/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const MyTodos = ({ todos, setTodos }) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);



  
  const getTodos = async () => {
    try {
      const response = await api.get("/todo");
      setTodos(response.data.data);
      toast.success(response.data.message || "succefully load data");
    } catch (err) {
      toast.error(err.response.data.message);
    }
  };

  const handleCompleteTodo = async (todo) => {
    try {
      const response = await api.put(`/todo/${todo._id}`, {
        completed: !todo.completed,
      });

      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? response.data.data : item)),
      );
      toast.success(response.data.message || "Task Successfully Updated");
    } catch (err) {
      toast.error(err.response.data.message);
    }
  };

  const handleDeleteTodo = async (id) => {

    const isConfirmed = window.confirm("Are you sure you want to delete this task?");
    if (!isConfirmed) return;

    try {
      const response = await api.delete(`/todo/${id}`);

      setTodos((prevTodo) => prevTodo.filter((todo) => todo._id !== id));
      toast.success(response?.data?.message || "Successfully Task Deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.message);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleUpdateTodo = async (todo) => {
    const title = editTitle.trim();
    const description = editDescription.trim();

    if (title.length < 3 || description.length < 3) {
      toast.error("Title and description must be at least 3 characters");
      return;
    }

    if (title === todo.title && description === todo.description) {
      cancelEdit();
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/todo/${todo._id}`, {
        title,
        description,
      });

      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? response.data.data : item)),
      );
      toast.success(response?.data?.message || "Task Successfully Updated");
      cancelEdit();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    getTodos();
  }, []);

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-gray-500">No tasks yet. Add one above!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Your Tasks</h2>
        <span className="text-sm text-gray-500">
          {todos.length} {todos.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {todos.map((todo) => (
          <div
            key={todo._id}
            className="flex items-start justify-between gap-3 bg-gray-50 border border-gray-200 border-l-4 border-l-indigo-500 p-4 rounded-lg hover:shadow-md transition"
          >
            <div className="min-w-0 flex-1">
              {editingId === todo._id ? (
                <div className="space-y-2">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTodo(todo);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    placeholder="Title"
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEdit();
                    }}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTodo(todo)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className={`font-semibold break-words ${
                      todo.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {todo.title}
                  </p>
                  <p
                    className={`text-sm mt-1 break-words ${
                      todo.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-600"
                    }`}
                  >
                    {todo.description}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {editingId !== todo._id && (
                <button
                  title="Edit"
                  onClick={() => startEdit(todo)}
                  className="p-2 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-500 hover:text-white transition"
                >
                  <FiEdit2 />
                </button>
              )}
              <button
                title={todo.completed ? "Mark as pending" : "Mark as done"}
                onClick={() => handleCompleteTodo(todo)}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition"
              >
                <FaCheck />
              </button>
              <button
                title="Delete"
                onClick={() => handleDeleteTodo(todo._id)}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition"
              >
                <RxCross1 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyTodos;
