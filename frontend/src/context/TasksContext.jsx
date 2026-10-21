/* The provider component and useTasks hook belong together. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";
import { normalizeTodo } from "../utils/tasks";

const TasksContext = createContext(null);
const emptyStats = {
  total: 0,
  completed: 0,
  pending: 0,
  inProgress: 0,
  overdue: 0,
};

function canceled(err) {
  return err.code === "ERR_CANCELED" || err.name === "CanceledError";
}

async function fetchSummary(signal) {
  const [statsResponse, recentResponse] = await Promise.all([
    api.get("/todo/stats", { signal }),
    api.get("/todo", {
      signal,
      params: { page: 1, limit: 5, sort: "newest" },
    }),
  ]);

  return {
    stats: statsResponse.data.data || emptyStats,
    recent: (recentResponse.data.data || []).map(normalizeTodo),
  };
}

export function TasksProvider({ children }) {
  const [stats, setStats] = useState(emptyStats);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    try {
      const result = await fetchSummary(controller.signal);
      if (controller.signal.aborted) return;
      setStats(result.stats);
      setRecent(result.recent);
    } catch (err) {
      if (canceled(err)) return;
      setError(getErrorMessage(err, "Could not load your tasks."));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchSummary(controller.signal)
      .then((result) => {
        if (!active) return;
        setStats(result.stats);
        setRecent(result.recent);
        setError("");
      })
      .catch((err) => {
        if (!active || canceled(err)) return;
        setError(getErrorMessage(err, "Could not load your tasks."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const refreshAfterChange = useCallback(async () => {
    const controller = new AbortController();
    try {
      const result = await fetchSummary(controller.signal);
      if (controller.signal.aborted) return;
      setStats(result.stats);
      setRecent(result.recent);
      setError("");
    } catch (err) {
      if (canceled(err)) return;
      setError(getErrorMessage(err, "Could not load your tasks."));
    }
  }, []);

  const value = useMemo(
    () => ({
      stats,
      recent,
      loading,
      error,
      reload,
      async createTodo(payload) {
        const response = await api.post("/todo", payload);
        const todo = normalizeTodo(response.data.data);
        await refreshAfterChange();
        return todo;
      },
      async updateTodo(id, payload) {
        const response = await api.put(`/todo/${id}`, payload);
        const todo = normalizeTodo(response.data.data);
        await refreshAfterChange();
        return todo;
      },
      async deleteTodo(id) {
        await api.delete(`/todo/${id}`);
        await refreshAfterChange();
      },
    }),
    [stats, recent, loading, error, reload, refreshAfterChange],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return context;
}
