import { FaCheck } from "react-icons/fa";
import { RxCross1 } from "react-icons/rx";
import api from "../services/api";
import { useEffect } from "react";

const MyTodos = ({ todos, setTodos }) => {
  const token = localStorage.getItem("AppAuthtoken");

  const getTodos = async () => {
    try {
      const response = await api.get("/todo", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTodos(response.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCompleteTodo = async (todo) => {
    const token = localStorage.getItem("AppAuthtoken");

    try {
      const response = await api.put(
        `/todo/${todo._id}`,
        {
          completed: !todo.completed,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTodos((prev) =>
        prev.map((item) => (item._id === todo._id ? response.data.data : item)),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await api.delete(`/todo/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTodos((prevTodo) => prevTodo.filter((todo) => todo._id !== id));
    } catch (err) {
      console.log(err);
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
            </div>
            <div className="flex gap-2 shrink-0">
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
