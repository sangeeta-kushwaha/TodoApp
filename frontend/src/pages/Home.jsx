import { Link } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiClock, FiList } from "react-icons/fi";
import { useState } from "react";
import toast from "react-hot-toast";
import TaskCard from "../components/tasks/TaskCard";
import TaskForm from "../components/tasks/TaskForm";
import Button from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { StatSkeleton, TaskListSkeleton } from "../components/ui/Skeleton";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { getErrorMessage } from "../utils/errors";

export default function Home() {
  const { user } = useAuth();
  const { stats, recent, loading, error, reload, updateTodo, deleteTodo } = useTasks();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const firstName = user?.name?.split(" ")[0] || "there";

  const saveEdit = async (payload) => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateTodo(editing._id, payload);
      toast.success("Task updated");
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update task"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || saving) return;
    setSaving(true);
    try {
      await deleteTodo(deleting._id);
      toast.success("Task deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (todo, status) => {
    if (todo.status === status) return;
    try {
      await updateTodo(todo._id, { status });
      toast.success("Status updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await updateTodo(todo._id, { completed: !todo.completed });
      toast.success(todo.completed ? "Marked as pending" : "Marked as completed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update task"));
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-text">Hello, {firstName}</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            These counts include every saved task. Pending means anything that
            is not completed. Open a card to see that list.
          </p>
        </div>
        <Link to="/tasks/new" className={buttonClass("primary")}>
          Add task
        </Link>
      </section>

      {loading ? (
        <StatSkeleton />
      ) : error ? null : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard to="/tasks" label="Total tasks" value={stats.total} hint="Everything you have saved" icon={FiList} />
          <StatCard to="/tasks?status=completed" label="Completed" value={stats.completed} hint="Marked done" icon={FiCheckCircle} />
          <StatCard
            to="/tasks?status=open"
            label="Pending"
            value={stats.pending}
            hint={
              stats.inProgress
                ? `${stats.inProgress} in progress`
                : "Not completed"
            }
            icon={FiClock}
          />
          <StatCard to="/tasks?status=overdue" label="Overdue" value={stats.overdue} hint="Due before today and still open" icon={FiAlertCircle} />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent tasks</h2>
          <Link to="/tasks" className="text-sm font-semibold text-accent-text">
            View all
          </Link>
        </div>

        {loading ? <TaskListSkeleton /> : null}
        {!loading && error ? (
          <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="font-semibold">Could not load tasks</p>
            <p className="mt-1 text-sm text-muted">{error}</p>
            <Button className="mt-4" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : null}
        {!loading && !error && recent.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Add a task with a priority and due date. It will show up here and in My Todos."
            action={
              <Link to="/tasks/new" className={buttonClass("primary")}>
                Add your first task
              </Link>
            }
          />
        ) : null}
        {!loading && !error
          ? recent.map((todo) => (
              <TaskCard
                key={todo._id}
                todo={todo}
                compact
                onToggle={toggleComplete}
                onStatus={changeStatus}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))
          : null}
      </section>

      <Modal
        open={Boolean(editing)}
        title="Edit task"
        description="Update the details, then save. Changes are stored in your account."
        onClose={() => {
          if (!saving) setEditing(null);
        }}
      >
        {editing ? (
          <div className="mt-4">
            <TaskForm
              key={editing._id}
              initialTask={editing}
              submitLabel="Save changes"
              loading={saving}
              onSubmit={saveEdit}
              onCancel={() => setEditing(null)}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        title="Delete this task?"
        description={
          deleting
            ? `"${deleting.title}" will be removed from your list. This cannot be undone.`
            : ""
        }
        onClose={() => {
          if (!saving) setDeleting(null);
        }}
      >
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={saving}>
            {saving ? "Deleting…" : "Delete task"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
