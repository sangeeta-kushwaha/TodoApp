import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export function readCookie(name) {
  const parts = document.cookie ? document.cookie.split("; ") : [];
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1));
}

export function hasSessionHint() {
  return readCookie("loggedIn") === "1";
}

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (["get", "head", "options"].includes(method)) return config;

  const csrfToken = readCookie("csrfToken");
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

const authPaths = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/logout"];

function isAuthRequest(url = "") {
  return authPaths.some((path) => url.includes(path));
}

let refreshRequest = null;
let endingSession = false;

export async function endSession() {
  if (endingSession) return;
  endingSession = true;

  try {
    await axios.post(
      `${baseURL}/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: { "X-CSRF-Token": readCookie("csrfToken") },
      },
    );
  } catch {
    // The cookie session is already unusable. The UI still leaves protected pages.
  } finally {
    endingSession = false;
    window.dispatchEvent(new Event("auth:logout"));
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      isAuthRequest(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = api.post("/auth/refresh").finally(() => {
          refreshRequest = null;
        });
      }
      await refreshRequest;
      return api(original);
    } catch (refreshError) {
      await endSession();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
