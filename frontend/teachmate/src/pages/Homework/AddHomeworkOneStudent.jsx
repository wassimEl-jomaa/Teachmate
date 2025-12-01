import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import decodeToken from "../../utils/utils";

const AddHomeworkOneStudent = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [subjectClassLevelId, setSubjectClassLevelId] = useState("");
  const [subjectClassLevels, setSubjectClassLevels] = useState([]);
  const [studentNames, setStudentNames] = useState([]);
  const [studentNameId, setStudentNameId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Pending");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingSCL, setLoadingSCL] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const titleRemaining = useMemo(() => Math.max(0, 100 - title.length), [title]);
  const descRemaining = useMemo(() => Math.max(0, 500 - description.length), [description]);

  // --- helpers ---
  const sanitizeInput = (input) => input.replace(/[<>]/g, "");
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userId = useMemo(() => {
    if (!token) return "";
    try {
      const message = decodeToken(token).split("|");
      return message[0];
    } catch {
      return "";
    }
  }, [token]);

  // --- load Subject–ClassLevel combos for this teacher ---
  useEffect(() => {
    const fetchSubjectClassLevels = async () => {
      if (!token || !userId) return;
      setLoadingSCL(true);
      setErrorMessage("");
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/subject_class_levels?user_id=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjectClassLevels(res.data || []);
      } catch (err) {
        setErrorMessage("Kunde inte hämta ämnen/klasser.");
      } finally {
        setLoadingSCL(false);
      }
    };
    fetchSubjectClassLevels();
  }, [token, userId]);

  // --- load students when classLevel changes ---
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classLevelId) {
        setStudentNames([]);
        setStudentNameId("");
        return;
      }
      setLoadingStudents(true);
      setErrorMessage("");
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/students/class_level/${classLevelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudentNames(res.data || []);
      } catch (err) {
        setErrorMessage("Kunde inte hämta elever för vald klass.");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [classLevelId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // basic validation
    if (!title.trim() || !description.trim() || !dueDate || !subjectClassLevelId || !studentNameId) {
      setErrorMessage("Fyll i alla obligatoriska fält.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) create homework
      const createHwBody = {
        title: sanitizeInput(title).slice(0, 100),
        description: sanitizeInput(description).slice(0, 500),
        due_date: dueDate,
        priority,
        status,
        subject_class_level_id: parseInt(subjectClassLevelId, 10),
      };

      const hwRes = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/homework/`, createHwBody, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 2) link to student
      const linkBody = {
        student_id: parseInt(studentNameId, 10),
        homework_id: parseInt(hwRes.data?.id, 10),
      };

      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/student_homeworks`, linkBody, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage("✅ Läxan har lagts till och kopplats till eleven!");
      // reset fields
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Normal");
      setStatus("Pending");
      setSubjectClassLevelId("");
      setClassLevelId("");
      setStudentNameId("");
      setStudentNames([]);
    } catch (err) {
      console.error("Error adding homework:", err?.response?.data || err);
      setErrorMessage(err?.response?.data?.detail || "Ett fel uppstod. Försök igen.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-gradient-to-br from-slate-50 via-white to-sky-50 py-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl p-8 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Lägg till läxa (en elev)</h1>
          <p className="text-blue-100 mt-2">
            Skapa en läxa, välj klass/ämne och koppla den till en specifik elev.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* alerts */}
            {errorMessage && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-2 text-sm">
                {successMessage}
              </div>
            )}

            {/* title + due date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                  Titel <span className="text-rose-600">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Läxa 1 – Skrivdagbok"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-xs text-slate-500 mt-1">{titleRemaining} tecken kvar</div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">
                  Förfallodatum <span className="text-rose-600">*</span>
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-xs text-slate-500 mt-1">Datumformat: ÅÅÅÅ-MM-DD</div>
              </div>
            </div>

            {/* description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Beskrivning <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv vad eleven ska göra…"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>✍️</span>
                <span>{descRemaining} tecken kvar</span>
              </div>
            </div>

            {/* priority + status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                  Prioritet
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">Hög</option>
                  <option value="Low">Låg</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Ej påbörjad</option>
                  <option value="In Progress">Pågår</option>
                  <option value="Completed">Klar</option>
                </select>
              </div>
            </div>

            {/* subject/class level */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="subjectClassLevel" className="block text-sm font-medium text-slate-700 mb-1">
                  Ämne & Klass <span className="text-rose-600">*</span>
                </label>
                {loadingSCL ? (
                  <div className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
                ) : (
                  <select
                    id="subjectClassLevel"
                    value={`${subjectClassLevelId},${classLevelId}`}
                    onChange={(e) => {
                      const [scl, cls] = e.target.value.split(",");
                      setSubjectClassLevelId(scl);
                      setClassLevelId(cls);
                    }}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Välj ämne & klass</option>
                    {subjectClassLevels.map((scl) => (
                      <option
                        key={scl.id}
                        value={`${scl.id},${scl.class_level_id}`}
                      >
                        {scl.subject?.name} – {scl.class_level?.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="text-xs text-slate-500 mt-1">Välj koppling för läxan.</div>
              </div>

              {/* student */}
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 mb-1">
                  Elev <span className="text-rose-600">*</span>
                </label>
                {loadingStudents ? (
                  <div className="h-10 w-full rounded-md bg-slate-200 animate-pulse" />
                ) : (
                  <select
                    id="studentName"
                    value={studentNameId}
                    onChange={(e) => setStudentNameId(e.target.value)}
                    disabled={!classLevelId}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  >
                    <option value="">{classLevelId ? "Välj elev" : "Välj först klass"}</option>
                    {studentNames.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user?.first_name} {student.user?.last_name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="text-xs text-slate-500 mt-1">Elever laddas baserat på vald klass.</div>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold shadow-sm transition
                  ${submitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
                `}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sparar…
                  </>
                ) : (
                  <>
                    ✅ Lägg till läxa
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setDueDate("");
                  setPriority("Normal");
                  setStatus("Pending");
                  setSubjectClassLevelId("");
                  setClassLevelId("");
                  setStudentNameId("");
                  setStudentNames([]);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
              >
                Rensa
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-max sticky top-6">
          <h3 className="text-lg font-bold text-slate-800 mb-3">Förhandsvisning</h3>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-sm px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                {priority || "Normal"}
              </span>
              <span className="text-sm px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-semibold">
                {status || "Pending"}
              </span>
            </div>
            <h4 className="text-xl font-semibold text-slate-900 mt-3">
              {title || "— Ingen titel —"}
            </h4>
            <p className="text-slate-700 mt-2 whitespace-pre-wrap min-h-[64px]">
              {description || "Beskrivning visas här…"}
            </p>
            <div className="mt-3 text-sm text-slate-600">
              <div>📅 <span className="font-medium">Förfallodatum:</span> {dueDate || "—"}</div>
              <div>🏷️ <span className="font-medium">Ämne/Klass:</span>{" "}
                {subjectClassLevelId
                  ? (subjectClassLevels.find(s => String(s.id) === String(subjectClassLevelId))?.subject?.name || "—")
                  : "—"}{" "}
                {classLevelId
                  ? `– ${subjectClassLevels.find(s => String(s.class_level_id) === String(classLevelId))?.class_level?.name || ""}`
                  : ""}
              </div>
              <div>👤 <span className="font-medium">Elev:</span>{" "}
                {studentNameId
                  ? (studentNames.find(s => String(s.id) === String(studentNameId))?.user?.first_name +
                      " " +
                      (studentNames.find(s => String(s.id) === String(studentNameId))?.user?.last_name || ""))
                  : "—"}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Förhandsvisningen uppdateras när du fyller i formuläret.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddHomeworkOneStudent;

