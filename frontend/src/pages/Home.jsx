import React, { useState } from "react";
import toast from "react-hot-toast";
import LogoutBtn from "../components/Button";

import MyTodos from "../components/MyTodos";
import api from "../services/api";

const Home = () => {
  const [todos, setTodos] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState({});

  const ValidationForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = "Title is Required.";
    }
    if (!description.trim()) {
      newErrors.description = "Description is Required.";
    }

    setError(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    const isValid = ValidationForm();

    if (!isValid) {
      return;
    }

    try {
      const token = localStorage.getItem("AppAuthtoken");

      const response = await api.post(
        "/todo",
        {
          title,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTitle("");
      setDescription("");

      setTodos((prevTodos) => [...prevTodos, response.data.data]);
      toast.success("Task added");
    } catch (err) {
      toast.error("Failed to add task");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:py-12">
      <div className="flex justify-end">
        <LogoutBtn />
      </div>
      <div className="mx-auto w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            My Todo App
          </h1>
          <p className="text-gray-500 mt-2">Manage your tasks here</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <form
            onSubmit={handleAddTodo}
            className="flex flex-col md:flex-row gap-3 mb-6"
          >
            <div className="w-full md:flex-1">
              <input
                className="w-full md:flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
              {error.title && (
                <p className="text-red-500 text-sm px-3">{error.title}</p>
              )}
            </div>

            <div className="w-full md:flex-1">
              <input
                className="w-full md:flex-[2] px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />

              {error.description && (
                <p className="text-red-500 text-sm px-3">{error.description}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition whitespace-nowrap"
            >
              Add Task
            </button>
          </form>

          <MyTodos todos={todos} setTodos={setTodos} />
        </div>
      </div>
    </div>
  );
};

export default Home;
