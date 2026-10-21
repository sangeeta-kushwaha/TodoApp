import { useState } from "react";
import { EMPTY_TASK, PRIORITIES, STATUSES } from "../../constants/tasks";
import { toDateInputValue } from "../../utils/tasks";
import { hasErrors, validateTaskForm } from "../../utils/validators";
import Button from "../ui/Button";
import { SelectField, TextArea, TextField } from "../ui/Fields";

export default function TaskForm({
  initialTask,
  submitLabel,
  loading,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_TASK,
    title: initialTask?.title || "",
    description: initialTask?.description || "",
    priority: initialTask?.priority || "medium",
    status: initialTask?.status || "pending",
    dueDate: toDateInputValue(initialTask?.dueDate),
  }));
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateTaskForm(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        id="task-title"
        label="Title"
        value={form.title}
        onChange={update("title")}
        error={errors.title}
        maxLength={100}
        placeholder="What needs to be done?"
        required
      />
      <TextArea
        id="task-description"
        label="Description"
        value={form.description}
        onChange={update("description")}
        error={errors.description}
        maxLength={500}
        placeholder="Add a short note"
        required
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          id="task-priority"
          label="Priority"
          value={form.priority}
          onChange={update("priority")}
        >
          {PRIORITIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="task-status"
          label="Status"
          value={form.status}
          onChange={update("status")}
        >
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="task-due-date"
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={update("dueDate")}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
