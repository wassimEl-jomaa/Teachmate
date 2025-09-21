import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/** Pill components */
const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
    {children}
  </span>
);

const StatusPill = ({ status }) => {
  const s = (status || "").toLowerCase();
  if (s === "completed")
    return <Pill className="bg-green-100 text-green-700 border border-green-200">Completed</Pill>;
  if (s === "in progress")
    return <Pill className="bg-yellow-100 text-yellow-700 border border-yellow-200">In Progress</Pill>;
  return <Pill className="bg-gray-100 text-gray-700 border border-gray-200">Pending</Pill>;
};

const PriorityPill = ({ priority }) => {
  const p = (priority || "").toLowerCase();
  if (p === "high")
    return <Pill className="bg-red-100 text-red-700 border border-red-200">High</Pill>;
  if (p === "low")
    return <Pill className="bg-blue-100 text-blue-700 border border-blue-200">Low</Pill>;
  return <Pill className="bg-slate-100 text-slate-700 border border-slate-200">Normal</Pill>;
};

const ToolbarButton = ({ children, onClick, variant = "primary" }) => {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition shadow-sm";
  const styles =
    variant === "ghost"
      ? "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
      : "bg-blue-600 hover:bg-blue-700 text-white";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
};

const ShowAllHomework = () => {
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // modal/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "Normal",
    status: "Pending",
  });

  // filters
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const token = localStorage.getItem("token");

  const fetchStudentHomeworks = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.get("http://127.0.0.1:8000/student_homeworks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentHomeworks(response.data || []);
    } catch (error) {
      console.error("Error fetching student homeworks:", error);
      setErrorMessage("Failed to fetch student homeworks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentHomeworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (studentHomeworks || []).filter((row) => {
      const hw = row.homework || {};
      const title = (hw.title || "").toLowerCase();
      const desc = (hw.description || "").toLowerCase();
      const status = (hw.status || "").toLowerCase();
      const priority = (hw.priority || "").toLowerCase();

      const matchesQ = q ? title.includes(q) || desc.includes(q) : true;
      const matchesStatus = statusFilter ? status === statusFilter.toLowerCase() : true;
      const matchesPriority = priorityFilter ? priority === priorityFilter.toLowerCase() : true;

      return matchesQ && matchesStatus && matchesPriority;
    });
  }, [studentHomeworks, query, statusFilter, priorityFilter]);

  const handleEdit = (studentHomework) => {
    setEditingHomework(studentHomework);
    setFormData({
      title: studentHomework.homework?.title || "",
      description: studentHomework.homework?.description || "",
      due_date: studentHomework.homework?.due_date || "",
      priority: studentHomework.homework?.priority || "Normal",
      status: studentHomework.homework?.status || "Pending",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Vill du radera denna elev-läxa?");
    if (!ok) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/student_homeworks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Optimistic update
      setStudentHomeworks((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting student homework:", error);
      setErrorMessage("Failed to delete student homework.");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!editingHomework?.homework?.id) return;

    try {
      await axios.put(
        `http://127.0.0.1:8000/homework/${editingHomework.homework.id}/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsModalOpen(false);
      setEditingHomework(null);
      await fetchStudentHomeworks();
    } catch (error) {
      console.error("Error updating homework:", error);
      setErrorMessage("Failed to update homework.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...d, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
          Läxor – Översikt
        </h2>
        <p className="text-slate-500 mt-1">
          Hantera alla tilldelade läxor för elever. Redigera, filtrera och radera.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök i titel eller beskrivning…"
              className="w-full pl-10 pr-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-slate-400">🔎</div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Status: Alla</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Prioritet: Alla</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          <ToolbarButton variant="ghost" onClick={fetchStudentHomeworks}>
            ↻ Uppdatera
          </ToolbarButton>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse p-5 rounded-xl border border-slate-200 bg-white">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-full mb-2" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-slate-700 font-semibold">Inga läxor matchar din filtrering.</p>
          <p className="text-slate-500">Justera sökningen eller uppdatera listan.</p>
          <div className="mt-4">
            <ToolbarButton variant="ghost" onClick={() => { setQuery(""); setStatusFilter(""); setPriorityFilter(""); }}>
              Rensa filter
            </ToolbarButton>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Student",
                  "Titel",
                  "Beskrivning",
                  "Deadline",
                  "Status",
                  "Prioritet",
                  "Lärare",
                  "Ämne",
                  "Klass",
                  "Betyg",
                  "Åtgärd",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const studentName =
                  row.student?.user?.first_name && row.student?.user?.last_name
                    ? `${row.student.user.first_name} ${row.student.user.last_name}`
                    : "N/A";
                const hw = row.homework || {};
                const teacherUser = hw.subject_class_level?.teacher?.user;
                const teacherName =
                  teacherUser?.first_name && teacherUser?.last_name
                    ? `${teacherUser.first_name} ${teacherUser.last_name}`
                    : "N/A";
                const subjectName = hw.subject_class_level?.subject?.name || "N/A";
                const className =
                  row.student?.class_level?.name ||
                  hw.subject_class_level?.class_level?.name ||
                  "N/A";

                return (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 border-b text-sm text-slate-700">{studentName}</td>
                    <td className="px-4 py-3 border-b text-sm font-medium text-slate-800">{hw.title || "N/A"}</td>
                    <td className="px-4 py-3 border-b text-sm text-slate-600">{hw.description || "N/A"}</td>
                    <td className="px-4 py-3 border-b text-sm text-slate-600">{hw.due_date || "N/A"}</td>
                    <td className="px-4 py-3 border-b text-sm">
                      <StatusPill status={hw.status} />
                    </td>
                    <td className="px-4 py-3 border-b text-sm">
                      <PriorityPill priority={hw.priority} />
                    </td>
                    <td className="px-4 py-3 border-b text-sm text-slate-700">{teacherName}</td>
                    <td className="px-4 py-3 border-b text-sm text-slate-700">{subjectName}</td>
                    <td className="px-4 py-3 border-b text-sm text-slate-700">{className}</td>
                    <td className="px-4 py-3 border-b text-sm text-slate-700">{row.grade || "–"}</td>
                    <td className="px-4 py-3 border-b text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="px-2.5 py-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        >
                          Radera
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-slate-800">Redigera läxa</h3>
            </div>
            <form onSubmit={handleModalSubmit} className="px-6 py-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titel</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioritet</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Spara ändringar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowAllHomework;
