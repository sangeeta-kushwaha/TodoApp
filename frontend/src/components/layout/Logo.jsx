export default function Logo({ className = "h-9 w-9" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-accent text-sm font-bold text-white ${className}`}
      aria-hidden="true"
    >
      T
    </span>
  );
}
