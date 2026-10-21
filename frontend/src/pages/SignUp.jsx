import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/layout/AuthLayout";
import Button from "../components/ui/Button";
import { TextField } from "../components/ui/Fields";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import { hasErrors, validateSignupForm } from "../utils/validators";

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateSignupForm({ name, email, password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      toast.success("Account created. You can log in now.");
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with your name, email, and a password."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent-text">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          id="name"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          placeholder="Your name"
          maxLength={50}
          required
        />
        <TextField
          id="signup-email"
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
          id="signup-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          allowReveal
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          placeholder="At least 6 characters"
          maxLength={72}
          required
        />
        <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
