import { Navigate } from "react-router-dom";
import FullPageLoader from "./ui/Skeleton";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/home" replace />;
  return children;
}
