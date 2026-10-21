import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import TaskForm from "../components/tasks/TaskForm";
import { useTasks } from "../context/TasksContext";
import { getErrorMessage } from "../utils/errors";

export default function AddTaskPage() {
  const { createTodo } = useTasks();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    if (loading) return;
    setLoading(true);
    try {
      await createTodo(payload);
      toast.success("Task added");
      navigate("/tasks");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add task"));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <TaskForm submitLabel="Add task" loading={loading} onSubmit={handleSubmit} />
    </div>
  );
}
