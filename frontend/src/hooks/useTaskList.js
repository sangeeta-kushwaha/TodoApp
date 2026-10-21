import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getErrorMessage } from "../utils/errors";
import {
  hasTaskFilters,
  parseTaskSearchParams,
  taskRequestParams,
  taskSearchParams,
} from "../utils/taskQuery";
import { normalizeTodo } from "../utils/tasks";

function canceled(err) {
  return err.code === "ERR_CANCELED" || err.name === "CanceledError";
}

export function useTaskList() {
  const [params, setParams] = useSearchParams();
  const queryKey = params.toString();
  const query = useMemo(
    () => parseTaskSearchParams(new URLSearchParams(queryKey)),
    [queryKey],
  );
  const [searchInput, setSearchInput] = useState(query.q);
  const [seenQuery, setSeenQuery] = useState(query.q);
  const [todos, setTodos] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const requestId = `${queryKey}:${reloadToken}`;
  const [seenRequest, setSeenRequest] = useState(requestId);

  if (query.q !== seenQuery) {
    setSeenQuery(query.q);
    if (searchInput.trim() !== query.q) setSearchInput(query.q);
  }

  if (seenRequest !== requestId) {
    setSeenRequest(requestId);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === query.q) return undefined;

    const timer = window.setTimeout(() => {
      setParams(taskSearchParams({ ...query, q: trimmed, page: 1 }), { replace: true });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput, query, setParams]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const current = parseTaskSearchParams(new URLSearchParams(queryKey));

    api
      .get("/todo", { params: taskRequestParams(current), signal: controller.signal })
      .then((response) => {
        if (!active) return;
        const nextMeta = response.data.meta || null;
        setTodos((response.data.data || []).map(normalizeTodo));
        setMeta(nextMeta);
        if (nextMeta && nextMeta.page !== current.page) {
          setParams(taskSearchParams({ ...current, page: nextMeta.page }), {
            replace: true,
          });
        }
      })
      .catch((err) => {
        if (!active || canceled(err)) return;
        setError(getErrorMessage(err, "Could not load your tasks."));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setLoadedOnce(true);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [queryKey, reloadToken, setParams]);

  const replaceQuery = (patch, { keepPage = false } = {}) => {
    setParams(
      taskSearchParams({
        ...query,
        ...patch,
        page: keepPage ? (patch.page ?? query.page) : 1,
      }),
      { replace: true },
    );
  };

  return {
    searchInput,
    setSearchInput,
    status: query.status,
    priority: query.priority,
    sort: query.sort,
    setStatus: (status) => replaceQuery({ status }),
    setPriority: (priority) => replaceQuery({ priority }),
    setSort: (sort) => replaceQuery({ sort }),
    setPage: (page) => replaceQuery({ page }, { keepPage: true }),
    clearFilters() {
      setSearchInput("");
      replaceQuery({ q: "", status: "all", priority: "all" });
    },
    filtersActive: hasTaskFilters(query),
    todos,
    meta,
    loading,
    loadedOnce,
    refreshing: loadedOnce && loading,
    error,
    reload() {
      setReloadToken((value) => value + 1);
    },
  };
}
