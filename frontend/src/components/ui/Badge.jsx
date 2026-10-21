const tones = {
  neutral: "bg-surface-muted text-ink",
  accent: "bg-accent-soft text-accent-text",
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  danger: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
};

export default function Badge({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
