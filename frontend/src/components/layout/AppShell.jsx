import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";

const pages = {
  "/home": {
    title: "Dashboard",
    description: "A snapshot of your tasks",
  },
  "/tasks": {
    title: "My Todos",
    description: "Search, filter, and update your tasks",
  },
  "/tasks/new": {
    title: "Add Task",
    description: "Create a task with priority, status, and a due date",
  },
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const current = pages[pathname] || { title: "Taskboard", description: "" };
  const title = current.title;
  const description = current.description;
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    document.title = `${title} · Taskboard`;
  }, [title]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <div className="lg:pl-72">
        <Header
          title={title}
          description={description}
          user={user}
          onMenu={() => setMenuOpen(true)}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
        <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
