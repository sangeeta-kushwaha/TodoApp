import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../components/tasks/Pagination";
import TaskCard from "../components/tasks/TaskCard";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskForm from "../components/tasks/TaskForm";
import Button from "../components/ui/Button";
import { buttonClass } from "../components/ui/buttonStyles";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { TaskListSkeleton } from "../components/ui/Skeleton";
import { useTasks } from "../context/TasksContext";
import { useTaskList } from "../hooks/useTaskList";
import { getErrorMessage } from "../utils/errors";

export default function TasksPage() {
  const { updateTodo, deleteTodo } = useTasks();
  const {
    searchInput,
    setSearchInput,
    status,
    priority,
    sort,
    setStatus,
    setPriority,
    setSort,
    setPage,
    clearFilters,
    filtersActive,
    todos,
    meta,
    loading,
    loadedOnce,
    refreshing,
    error,
    reload,
  } = useTaskList();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveEdit = async (payload) => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateTodo(editing._id, payload);
      reload();
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
      reload();
      toast.success("Task deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete task"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (todo, nextStatus) => {
    if (todo.status === nextStatus) return;
    try {
      await updateTodo(todo._id, { status: nextStatus });
      reload();
      toast.success("Status updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const toggleComplete = async (todo) => {
    try {
      await updateTodo(todo._id, { completed: !todo.completed });
      reload();
      toast.success(todo.completed ? "Marked as pending" : "Marked as completed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update task"));
    }
  };

  return (
    <div className="space-y-5">
      <TaskFilters
        search={searchInput}
        status={status}
        priority={priority}
        sort={sort}
        onSearch={setSearchInput}
        onStatus={setStatus}
        onPriority={setPriority}
        onSort={setSort}
      />

      {!loadedOnce && loading ? <TaskListSkeleton count={4} /> : null}

      {loadedOnce && error ? (
        <div role="alert" className="rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-semibold">Could not load tasks</p>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <Button className="mt-4" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : null}

      {loadedOnce && !error && !filtersActive && meta?.total === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="When you add a task, you can search, filter, and sort it from this page."
          action={
            <Link to="/tasks/new" className={buttonClass("primary")}>
              Add task
            </Link>
          }
        />
      ) : null}

      {loadedOnce && !error && filtersActive && meta?.total === 0 ? (
        <EmptyState
          title="No matching tasks"
          description="Try a different search, status, or priority."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : null}

      {loadedOnce && !error && todos.length > 0 ? (
        <div className={`space-y-3 ${refreshing ? "opacity-60" : ""}`} aria-busy={refreshing}>
          {todos.map((todo) => (
            <TaskCard
              key={todo._id}
              todo={todo}
              onToggle={toggleComplete}
              onStatus={updateStatus}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : null}

      {loadedOnce && !error && meta ? (
        <Pagination
          page={meta.page}
          pageCount={meta.pageCount}
          start={meta.start}
          end={meta.end}
          total={meta.total}
          onPage={setPage}
        />
      ) : null}

      <Modal
        open={Boolean(editing)}
        title="Edit task"
        description="Changes are saved to your account and stay after a refresh."
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
            ? `"${deleting.title}" will be removed permanently.`
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
