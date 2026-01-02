import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "todo_crud_v2_labels";

function uid() {
  return crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const PRIORITIES = [
  { key: "all", label: "All" },
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "urgent", label: "Urgent" },
];

function normalizePriority(p) {
  const allowed = new Set(["low", "medium", "high", "urgent"]);
  return allowed.has(p) ? p : "medium";
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: String(t.id ?? uid()),
        title: String(t.title ?? ""),
        completed: Boolean(t.completed),
        priority: normalizePriority(String(t.priority ?? "medium").toLowerCase()), // NEW
        createdAt: Number(t.createdAt ?? Date.now()),
        updatedAt: Number(t.updatedAt ?? Date.now()),
      }))
      .filter((t) => t.title.trim().length > 0);
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

const cx = (...c) => c.filter(Boolean).join(" ");

function PriorityBadge({ priority }) {
  const map = {
    low: "bg-emerald-500/15 border-emerald-300/20 text-emerald-200",
    medium: "bg-sky-500/15 border-sky-300/20 text-sky-200",
    high: "bg-amber-500/15 border-amber-300/20 text-amber-200",
    urgent: "bg-rose-500/15 border-rose-300/20 text-rose-200",
  };
  const text = PRIORITIES.find((p) => p.key === priority)?.label ?? "Medium";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        map[priority] ?? map.medium
      )}
    >
      {text}
    </span>
  );
}

export default function App() {
  const [todos, setTodos] = useState(() => loadTodos());

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium"); // NEW

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium"); // NEW

  const [statusFilter, setStatusFilter] = useState("all"); // all | active | completed
  const [priorityFilter, setPriorityFilter] = useState("all"); // NEW: all|low|medium|high|urgent
  const [query, setQuery] = useState("");

  useEffect(() => saveTodos(todos), [todos]);

  // ===== CRUD =====
  function createTodo(e) {
    e?.preventDefault?.();
    const title = newTitle.trim();
    if (!title) return;

    const now = Date.now();
    setTodos((prev) => [
      {
        id: uid(),
        title,
        completed: false,
        priority: normalizePriority(newPriority),
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);

    setNewTitle("");
    setNewPriority("medium");
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingPriority(todo.priority);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
    setEditingPriority("medium");
  }

  function updateTodo(id) {
    const title = editingTitle.trim();
    if (!title) return;

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title,
              priority: normalizePriority(editingPriority),
              updatedAt: Date.now(),
            }
          : t
      )
    );
    cancelEdit();
  }

  function deleteTodo(id) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) cancelEdit();
  }

  function toggleComplete(id) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t
      )
    );
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  // ===== stats + counts =====
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    return { total, completed, active: total - completed };
  }, [todos]);

  const priorityCounts = useMemo(() => {
    const counts = { all: todos.length, low: 0, medium: 0, high: 0, urgent: 0 };
    for (const t of todos) counts[t.priority] = (counts[t.priority] ?? 0) + 1;
    return counts;
  }, [todos]);

  const visibleTodos = useMemo(() => {
    const q = query.trim().toLowerCase();

    return todos
      .filter((t) => {
        if (statusFilter === "active") return !t.completed;
        if (statusFilter === "completed") return t.completed;
        return true;
      })
      .filter((t) => {
        if (priorityFilter === "all") return true;
        return t.priority === priorityFilter;
      })
      .filter((t) => (!q ? true : t.title.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [todos, statusFilter, priorityFilter, query]);

  return (
    <div className="min-h-screen text-slate-50">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-slate-950" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-3xl opacity-40 bg-gradient-to-tr from-fuchsia-500 via-sky-500 to-emerald-400" />
        <div className="absolute bottom-[-10rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500" />
        <div className="absolute top-20 left-10 h-40 w-40 rounded-full blur-2xl opacity-20 bg-gradient-to-tr from-sky-400 to-fuchsia-400" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              To-do{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-sky-300 to-emerald-200 bg-clip-text text-transparent">
                List
              </span>
            </h1>
            <p className="mt-2 text-slate-300">
              Filter by urgency like you’re switching playlists ✨
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <div className="text-xs text-slate-400">Progress</div>
            <div className="mt-1 w-40 rounded-full bg-white/10 p-1">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-fuchsia-300 transition-all"
                style={{
                  width: `${stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 text-xs text-slate-300">
              {stats.total === 0 ? "0%" : Math.round((stats.completed / stats.total) * 100)}%
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
          {/* Top bar */}
          <div className="flex flex-col gap-4 p-5 sm:p-6 border-b border-white/10">
            {/* Create */}
            <form onSubmit={createTodo} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  +
                </span>
                <input
                  className="w-full rounded-2xl bg-slate-950/30 border border-white/10 px-10 py-3 outline-none
                             focus:border-white/20 focus:ring-2 focus:ring-white/10 placeholder:text-slate-500"
                  placeholder="Add a task…"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={120}
                />
              </div>

              {/* urgency selector */}
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="rounded-2xl bg-slate-950/30 border border-white/10 px-3 py-3 text-sm outline-none
                           focus:border-white/20 focus:ring-2 focus:ring-white/10"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                type="submit"
                className="rounded-2xl px-5 py-3 font-semibold text-slate-950
                           bg-gradient-to-r from-emerald-200 via-sky-200 to-fuchsia-200
                           hover:opacity-95 active:opacity-90 transition"
              >
                Add
              </button>
            </form>

            {/* Filters row */}
            <div className="flex flex-col gap-3">
              {/* Status filter */}
              <div className="flex flex-wrap gap-2">
                {["all", "active", "completed"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={cx(
                      "rounded-2xl px-3 py-2 text-sm border transition",
                      statusFilter === f
                        ? "bg-white/15 border-white/20 text-white"
                        : "bg-slate-950/20 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    {f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Priority navigation chips */}
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriorityFilter(p.key)}
                    className={cx(
                      "rounded-2xl px-3 py-2 text-sm border transition flex items-center gap-2",
                      priorityFilter === p.key
                        ? "bg-white/15 border-white/20 text-white"
                        : "bg-slate-950/20 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <span>{p.label}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">
                      {priorityCounts[p.key] ?? 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search + clear */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <input
                  className="w-full sm:w-80 rounded-2xl bg-slate-950/20 border border-white/10 px-3 py-2 text-sm outline-none
                             focus:border-white/20 focus:ring-2 focus:ring-white/10 placeholder:text-slate-500"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                <button
                  type="button"
                  onClick={clearCompleted}
                  disabled={stats.completed === 0}
                  className="rounded-2xl px-3 py-2 text-sm border border-white/10 bg-slate-950/20
                             hover:bg-white/10 hover:border-white/20 transition
                             disabled:opacity-40 disabled:hover:bg-slate-950/20 disabled:hover:border-white/10"
                >
                  Clear done
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Active" value={stats.active} />
              <StatCard label="Done" value={stats.completed} />
            </div>
          </div>

          {/* List */}
          <div className="p-5 sm:p-6">
            {visibleTodos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-6 text-slate-300">
                No todos found for that filter ✨
              </div>
            ) : (
              <div className="space-y-3">
                {visibleTodos.map((todo) => (
                  <TodoRow
                    key={todo.id}
                    todo={todo}
                    isEditing={editingId === todo.id}
                    editingTitle={editingTitle}
                    editingPriority={editingPriority}
                    setEditingTitle={setEditingTitle}
                    setEditingPriority={setEditingPriority}
                    onToggle={() => toggleComplete(todo.id)}
                    onEdit={() => startEdit(todo)}
                    onCancel={cancelEdit}
                    onSave={() => updateTodo(todo.id)}
                    onDelete={() => deleteTodo(todo.id)}
                  />
                ))}
              </div>
            )}
            <div className="mt-8 text-xs text-slate-400">
              Tip: press <span className="text-slate-200">Esc</span> to cancel edit,
              <span className="text-slate-200"> Enter</span> to save.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-50">{value}</div>
    </div>
  );
}

function TodoRow({
  todo,
  isEditing,
  editingTitle,
  editingPriority,
  setEditingTitle,
  setEditingPriority,
  onToggle,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-slate-950/20 p-4 transition hover:bg-white/5 hover:border-white/20">
      {!isEditing ? (
        <div className="flex items-start gap-3">
          <button
            onClick={onToggle}
            type="button"
            className={cx(
              "mt-1 h-6 w-6 rounded-lg border flex items-center justify-center transition",
              todo.completed
                ? "bg-white text-slate-950 border-white"
                : "border-white/20 hover:border-white/40"
            )}
            aria-label="Toggle complete"
          >
            {todo.completed ? "✓" : ""}
          </button>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cx(
                  "text-base font-medium",
                  todo.completed ? "line-through text-slate-400" : "text-slate-50"
                )}
              >
                {todo.title}
              </div>
              <PriorityBadge priority={todo.priority} />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {todo.completed ? "Completed vibes ✨" : "In progress…"}
            </div>
          </div>

          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl px-3 py-2 text-sm border border-white/10 bg-slate-950/10 hover:bg-white/10 hover:border-white/20"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl px-3 py-2 text-sm border border-rose-400/20 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-400/30"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            className="w-full rounded-2xl bg-slate-950/20 border border-white/10 px-4 py-3 outline-none
                       focus:border-white/20 focus:ring-2 focus:ring-white/10"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            autoFocus
            maxLength={120}
          />

          <select
            value={editingPriority}
            onChange={(e) => setEditingPriority(e.target.value)}
            className="rounded-2xl bg-slate-950/20 border border-white/10 px-3 py-3 text-sm outline-none
                       focus:border-white/20 focus:ring-2 focus:ring-white/10"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-2xl px-4 py-3 font-semibold text-slate-950
                         bg-gradient-to-r from-emerald-200 via-sky-200 to-fuchsia-200
                         hover:opacity-95 active:opacity-90 transition"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl px-4 py-3 border border-white/10 bg-slate-950/10 hover:bg-white/10 hover:border-white/20 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
