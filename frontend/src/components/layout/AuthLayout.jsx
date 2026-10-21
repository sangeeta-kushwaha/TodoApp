import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <Link to="/login" className="flex items-center gap-3">
          <Logo />
          <span className="text-lg font-semibold">Taskboard</span>
        </Link>
        <div className="max-w-md">
          <p className="text-4xl font-semibold tracking-tight">
            Keep today clear, and tomorrow planned.
          </p>
          <p className="mt-4 text-sidebar-muted">
            Track what is pending, in progress, and overdue. Your tasks stay
            private to your account.
          </p>
        </div>
        <p className="text-sm text-sidebar-muted">Personal task manager</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
            <p className="mt-3 text-lg font-semibold">Taskboard</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <div className="mt-5 text-center text-sm text-muted">{footer}</div>
        </div>
      </section>
    </div>
  );
}
