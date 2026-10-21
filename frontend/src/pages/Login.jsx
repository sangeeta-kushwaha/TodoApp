import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import { TextField } from "../components/ui/Fields";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import { hasErrors, validateLoginForm } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateLoginForm({ email, password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      toast.success(response.message || "Login successful");
      navigate("/home");
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your tasks."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-accent-text">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          required
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          allowReveal
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          required
        />
        <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
