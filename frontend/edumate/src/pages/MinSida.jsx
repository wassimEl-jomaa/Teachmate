
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import decodeToken from "../utils/utils";
import { Link } from "react-router-dom";

/* helpers */
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
const overdue = (iso, completed) => !completed && iso && new Date(iso) < new Date();
const priorityBadge = (p) => {
  switch ((p || "").toLowerCase()) {
    case "high": return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case "low": return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    default: return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
};

const MinSida = () => {
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | completed
  const [priorityFilter, setPriorityFilter] = useState("all"); // all | High | Normal | Low
  const [sortKey, setSortKey] = useState("due"); // due | title | priority

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        const [userIdRaw] = decodeToken(token).split("|");
        const userId = parseInt(userIdRaw, 10);

        const studentRes = await axios.get(
          `http://127.0.0.1:8000/students/by_user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudent(studentRes.data);

        const hwRes = await axios.get(
          `http://127.0.0.1:8000/student_homeworks?student_id=${studentRes.data.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHomeworks(hwRes.data);
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || "Något gick fel";
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = homeworks.length;
  const done = homeworks.filter((h) => h.is_completed || h.homework?.status === "completed").length;
  const pending = total - done;
  const late = homeworks.filter((h) => overdue(h.homework?.due_date, h.is_completed || h.homework?.status === "completed")).length;

  const visibleHomeworks = useMemo(() => {
    let list = [...homeworks];

    // search
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (h) =>
          h.homework?.title?.toLowerCase().includes(q) ||
          h.homework?.description?.toLowerCase().includes(q)
      );
    }

    // status filter
    if (statusFilter === "pending") {
      list = list.filter((h) => !(h.is_completed || h.homework?.status === "completed"));
    } else if (statusFilter === "completed") {
      list = list.filter((h) => h.is_completed || h.homework?.status === "completed");
    }

    // priority filter
    if (priorityFilter !== "all") {
      list = list.filter(
        (h) => (h.homework?.priority || "Normal").toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // sort
    if (sortKey === "due") {
      list.sort((a, b) => new Date(a.homework?.due_date || 0) - new Date(b.homework?.due_date || 0));
    } else if (sortKey === "title") {
      list.sort((a, b) => (a.homework?.title || "").localeCompare(b.homework?.title || ""));
    } else if (sortKey === "priority") {
      const order = { high: 0, normal: 1, low: 2 };
      list.sort((a, b) => {
        const ai = order[(a.homework?.priority || "normal").toLowerCase()] ?? 9;
        const bi = order[(b.homework?.priority || "normal").toLowerCase()] ?? 9;
        return ai - bi;
      });
    }

    return list;
  }, [homeworks, query, statusFilter, priorityFilter, sortKey]);

  const handleMarkAsComplete = async (id) => {
    const token = localStorage.getItem("token");
    const prev = homeworks;
    try {
      setBusyId(id);
      // Optimistic update
      setHomeworks((p) =>
        p.map((hw) =>
          hw.id === id ? { ...hw, is_completed: true, homework: { ...hw.homework, status: "completed" } } : hw
        )
      );

      await axios.patch(
        `http://127.0.0.1:8000/student_homeworks/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      setHomeworks(prev);
      setErrorMessage("Kunde inte markera som klar.");
    } finally {
      setBusyId(null);
    }
  };

  /* Loading */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
        <p className="mt-4 text-blue-700 font-semibold">Laddar din sida…</p>
      </div>
    );
  }

  /* Error */
  if (errorMessage) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-6 py-4 shadow">
          ⚠️ {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 border-r border-blue-200 p-6">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Meny</h2>
          <nav className="space-y-2">
            <Link to="/minbetyg" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">
              Betyg
            </Link>
            <Link to="/minmeddelande" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">
              Meddelande
            </Link>
            <Link to="/minfeedback" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">
              Feedback
            </Link>
            <Link to="/ai-suggestions" className="block py-2 px-3 rounded-md hover:bg-purple-200/60 text-purple-800 font-medium">
              AI-förslag
            </Link>
            <Link to="/recommended-resources" className="block py-2 px-3 rounded-md hover:bg-green-200/60 text-green-800 font-medium">
              Rekommenderade Resurser
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 container mx-auto px-6 py-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white p-8 shadow-xl mb-8">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <h1 className="text-4xl font-extrabold tracking-tight">Min Sida</h1>
            {student && (
              <p className="mt-2 text-blue-100 text-lg">
                Välkommen, <span className="font-semibold">{student.user.first_name} {student.user.last_name}</span> 👋
              </p>
            )}
            <p className="text-blue-100/90">Här får du full koll på dina läxor.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm">Totalt</p>
              <p className="text-3xl font-extrabold text-slate-800">{total}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-green-200">
              <p className="text-green-600 text-sm">Klara</p>
              <p className="text-3xl font-extrabold text-green-700">{done}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-amber-200">
              <p className="text-amber-600 text-sm">Ej klara</p>
              <p className="text-3xl font-extrabold text-amber-700">{pending}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-red-200">
              <p className="text-red-600 text-sm">Försenade</p>
              <p className="text-3xl font-extrabold text-red-700">{late}</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition
                ${statusFilter === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"}`}
              >
                Alla
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition
                ${statusFilter === "pending" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"}`}
              >
                Ej klara
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition
                ${statusFilter === "completed" ? "bg-green-600 text-white border-green-600" : "bg-white text-green-700 border-green-300 hover:bg-green-50"}`}
              >
                Klara
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
              >
                <option value="all">Alla prioriteter</option>
                <option value="High">Hög</option>
                <option value="Normal">Normal</option>
                <option value="Low">Låg</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700"
              >
                <option value="due">Sortera: Förfallodatum</option>
                <option value="title">Sortera: Titel</option>
                <option value="priority">Sortera: Prioritet</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Sök läxa…"
                  className="pl-10 pr-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 w-56"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
            </div>
          </div>

          {/* List */}
          <h2 className="text-2xl font-semibold mb-4 text-slate-700">📚 Mina Läxor</h2>

          {visibleHomeworks.length === 0 ? (
            <p className="text-gray-500 italic">Inga läxor matchar dina filter.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleHomeworks.map((shw) => {
                const hw = shw.homework || {};
                const isDone = shw.is_completed || hw.status === "completed";
                const isLate = overdue(hw.due_date, isDone);

                return (
                  <div
                    key={shw.id}
                    className="group border border-gray-200 p-6 rounded-2xl shadow-sm bg-white hover:shadow-lg hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{hw.title}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${priorityBadge(hw.priority)}`}>
                        {hw.priority || "Normal"}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-3">{hw.description}</p>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Förfallo:</span>
                        <span className={`font-medium ${isLate ? "text-red-600" : "text-gray-800"}`}>
                          {fmtDate(hw.due_date)}
                        </span>
                      </div>
                      {isLate && !isDone && (
                        <span className="text-red-600 text-xs font-semibold">Försenad</span>
                      )}
                    </div>

                    <div className="mb-4">
                      {isDone ? (
                        <span className="inline-flex items-center gap-2 text-green-700 bg-green-100 ring-1 ring-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                          <span>✅</span> Klar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-amber-700 bg-amber-100 ring-1 ring-amber-200 px-3 py-1 rounded-full text-sm font-semibold">
                          <span>⏳</span> Ej klar
                        </span>
                      )}
                    </div>

                    {!isDone && (
                      <button
                        onClick={() => handleMarkAsComplete(shw.id)}
                        disabled={busyId === shw.id}
                        className={`w-full py-2.5 rounded-lg font-semibold shadow transition-colors
                          ${busyId === shw.id ? "bg-green-300 text-white cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"}`}
                      >
                        {busyId === shw.id ? "Markerar…" : "Markera som Klar ✅"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MinSida;

