import { useState } from "react";
import { STATUSES } from "../../constants/tasks";
import {
  formatDate,
  formatDateTime,
  isOverdue,
  priorityLabel,
  statusLabel,
} from "../../utils/tasks";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const priorityTone = { low: "neutral", medium: "warning", high: "danger" };
const statusTone = {
  pending: "accent",
  in_progress: "warning",
  completed: "success",
};

export default function TaskCard({ todo, compact = false, onToggle, onStatus, onEdit, onDelete }) {
  const [busy, setBusy] = useState(false);
  const overdue = isOverdue(todo);

  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-pressed={todo.completed}
          aria-label={
            todo.completed
              ? `Mark ${todo.title} as incomplete`
              : `Mark ${todo.title} as complete`
          }
          disabled={busy}
          onClick={() => run(() => onToggle(todo))}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
            todo.completed
              ? "border-accent bg-accent text-white"
              : "border-line bg-surface text-transparent"
          }`}
        >
          <span aria-hidden="true" className="text-xs font-bold">
            ✓
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2
              className={`text-base font-semibold break-words ${
                todo.completed ? "text-muted line-through" : "text-ink"
              }`}
            >
              {todo.title}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge tone={priorityTone[todo.priority]}>
                {priorityLabel(todo.priority)}
              </Badge>
              <Badge tone={statusTone[todo.status]}>{statusLabel(todo.status)}</Badge>
              {overdue ? <Badge tone="danger">Overdue</Badge> : null}
            </div>
          </div>
          <p
            className={`mt-1 text-sm break-words text-muted ${compact ? "line-clamp-2" : ""}`}
          >
            {todo.description}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <div>
              <dt className="inline font-medium">Due </dt>
              <dd className={`inline ${overdue ? "font-semibold text-danger" : ""}`}>
                {todo.dueDate ? formatDate(todo.dueDate) : "No due date"}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Created </dt>
              <dd className="inline">{formatDateTime(todo.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm text-muted" htmlFor={`status-${todo._id}`}>
          <span className="sr-only">Status for {todo.title}</span>
          <select
            id={`status-${todo._id}`}
            value={todo.status}
            disabled={busy}
            onChange={(event) => run(() => onStatus(todo, event.target.value))}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(todo)} disabled={busy}>
            Edit
          </Button>
          <Button variant="ghost" onClick={() => onDelete(todo)} disabled={busy}>
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
