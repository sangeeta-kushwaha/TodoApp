import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted";

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  error,
  icon: Icon,
  allowReveal = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const inputType = allowReveal && visible ? "text" : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
        ) : null}
        <input
          id={id}
          type={inputType}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`${fieldClass} ${Icon ? "pl-10" : ""} ${allowReveal ? "pr-11" : ""}`}
          {...props}
        />
        {allowReveal ? (
          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible((current) => !current)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          >
            {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function TextArea({ id, label, error, rows = 4, ...props }) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={fieldClass}
        {...props}
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

export function SelectField({ id, label, error, children, ...props }) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={fieldClass}
        {...props}
      >
        {children}
      </select>
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
