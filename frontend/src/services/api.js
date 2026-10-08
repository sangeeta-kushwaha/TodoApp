import axios from "axios";
import { Navigate } from "react-router-dom";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("AppAuthtoken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.this.status === 401) {
      localStorage.removeItem("AppAuthtoken");
      <Navigate to="/login" />;
    }
    return Promise.reject(err);
  },
);

export default api;
