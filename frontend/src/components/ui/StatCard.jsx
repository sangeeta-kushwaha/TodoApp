import { Link } from "react-router-dom";

export default function StatCard({ label, value, hint, icon: Icon, to }) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
        {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
        <Icon aria-hidden="true" size={18} />
      </div>
    </div>
  );

  if (!to) {
    return (
      <article className="rounded-2xl border border-line bg-surface p-5 shadow-card">{body}</article>
    );
  }

  return (
    <Link
      to={to}
      aria-label={`${label}: ${value}. View tasks`}
      className="block rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-accent"
    >
      {body}
    </Link>
  );
}
