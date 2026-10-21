const variants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary:
    "border border-line bg-surface text-ink hover:bg-surface-muted",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-muted hover:bg-surface-muted hover:text-ink",
};

export function buttonClass(variant = "primary", className = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
