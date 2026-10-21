import { Navigate } from "react-router-dom";
import FullPageLoader from "./ui/Skeleton";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
