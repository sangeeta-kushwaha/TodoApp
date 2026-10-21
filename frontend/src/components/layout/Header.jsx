import { FiLogOut, FiMenu, FiMoon, FiSun } from "react-icons/fi";
import { useState } from "react";
import Button from "../ui/Button";

function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}

export default function Header({ title, description, user, onMenu, onLogout, loggingOut }) {
  const { theme, toggleTheme } = useTheme();
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-xl border border-line bg-surface p-2 text-ink lg:hidden"
          aria-label="Open menu"
          onClick={onMenu}
        >
          <FiMenu aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
          {description ? (
            <p className="truncate text-sm text-muted">{description}</p>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={theme === "dark"}
          onClick={toggleTheme}
          className="rounded-xl border border-line bg-surface p-2 text-ink"
        >
          {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text">
            {initial}
          </span>
          <span className="max-w-40 truncate text-sm font-medium text-ink">
            {user?.name}
          </span>
        </div>

        <Button variant="secondary" onClick={onLogout} disabled={loggingOut}>
          <FiLogOut aria-hidden="true" />
          {loggingOut ? "Signing out…" : "Log out"}
        </Button>
      </div>
    </header>
  );
}
