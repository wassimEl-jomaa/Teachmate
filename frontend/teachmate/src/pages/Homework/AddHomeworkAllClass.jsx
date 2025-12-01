import React, { useEffect, useState } from "react";
import axios from "axios";
import decodeToken from "../../utils/utils";

const AddHomeworkAllClass = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Pending");

  const [subjectClassLevels, setSubjectClassLevels] = useState([]);
  const [subjectClassLevelId, setSubjectClassLevelId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- helpers ---
  const sanitizeInput = (input) => input.replace(/[<>]/g, "");

  const toErrorText = (err) => {
    // Turn axios / pydantic errors into readable text
    if (!err) return "Unknown error";
    if (err.response?.data?.detail) {
      // FastAPI HTTPException detail
      if (Array.isArray(err.response.data.detail)) {
        // Pydantic validation list
        return err.response.data.detail
          .map((e) =>
            typeof e === "string"
              ? e
              : `${e?.loc?.join(".") || "field"}: ${e?.msg || "invalid"}`
          )
          .join(" | ");
      }
      return String(err.response.data.detail);
    }
    if (typeof err.message === "string") return err.message;
    try {
      return JSON.stringify(err);
    } catch {
      return "Request failed";
    }
  };

  // --- load teacher's subject_class_levels ---
  useEffect(() => {
    const fetchSubjectClassLevels = async () => {
      try {
        const token = localStorage.getItem("token");
        const [userId] = decodeToken(token).split("|");
        const res = await axios.get(
          `http://127.0.0.1:8000/subject_class_levels?user_id=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubjectClassLevels(res.data || []);
      } catch (err) {
        setErrorMessage(`Kunde inte hämta ämnen/klasser: ${toErrorText(err)}`);
      }
    };
    fetchSubjectClassLevels();
  }, []);

  // --- when a class is selected, load students in that class ---
  useEffect(() => {
    const fetchStudents = async () => {
      if (!classLevelId) {
        setStudents([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://127.0.0.1:8000/students/class_level/${classLevelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(res.data || []);
      } catch (err) {
        setErrorMessage(`Kunde inte hämta elever: ${toErrorText(err)}`);
      }
    };
    fetchStudents();
  }, [classLevelId]);

  const handleSelectSubjectClassLevel = (value) => {
    // value is "sclId,classLevelId"
    const [sclId, clsId] = value.split(",");
    setSubjectClassLevelId(sclId);
    setClassLevelId(clsId);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const token = localStorage.getItem("token");

    // Normalize status to what backend expects (your model uses lower-case "pending"/"completed")
    const normalizedStatus = (status || "").toLowerCase(); // "pending" | "completed" | "in progress" (if allowed)

    const hwPayload = {
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      due_date: dueDate, // YYYY-MM-DD
      priority,
      status: normalizedStatus,
      subject_class_level_id: parseInt(subjectClassLevelId, 10),
    };

    try {
      // 1) Create the homework once
      const hwRes = await axios.post("http://127.0.0.1:8000/homework/", hwPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const homeworkId = hwRes.data?.id;

      // 2) De-duplicate students by id
      const uniqueStudents = [...new Map(students.map((s) => [s.id, s])).values()];

      // 3) Create Student_Homework for each student
      const results = await Promise.allSettled(
        uniqueStudents.map((student) =>
          axios.post(
            "http://127.0.0.1:8000/student_homeworks",
            { student_id: student.id, homework_id: homeworkId },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        // Backend has duplicate protection; some may fail because they already exist.
        // We still consider overall operation a success if at least one succeeded.
        const failText = failures
          .slice(0, 3)
          .map((f) => toErrorText(f.reason))
          .join(" | ");
        setSuccessMessage(
          `Läxan skapades. Vissa elever kunde ej tilldelas (t.ex. dubletter). (${failText})`
        );
      } else {
        setSuccessMessage("Läxan skapades och tilldelades till hela klassen!");
      }

      // reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Normal");
      setStatus("Pending");
      setSubjectClassLevelId("");
      setClassLevelId("");
      setStudents([]);
    } catch (err) {
      setErrorMessage(`Misslyckades att skapa läxa: ${toErrorText(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Lägg till läxa till hela klassen</h1>

      {errorMessage && (
        <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 rounded bg-green-50 text-green-700">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        <div className="mb-4">
          <label className="block font-medium mb-1">Titel</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            placeholder="Ex: Läxa 1 – Skrivdagbok"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Beskrivning</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
            placeholder="Ex: Skriv 5–8 meningar om helgen"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block font-medium mb-1">Förfallodatum</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Prioritet</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>
        </div>

        <div className="mt-4 mb-6">
          <label className="block font-medium mb-1">Ämne & Klass</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={subjectClassLevelId && classLevelId ? `${subjectClassLevelId},${classLevelId}` : ""}
            onChange={(e) => handleSelectSubjectClassLevel(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Välj ämne & klass</option>
            {subjectClassLevels.map((scl) => (
              <option key={scl.id} value={`${scl.id},${scl.class_level_id}`}>
                {scl.subject?.name} — {scl.class_level?.name}
              </option>
            ))}
          </select>
          {classLevelId && (
            <p className="text-sm text-gray-500 mt-1">
              {students.length} elever i klassnivå {classLevelId}
            </p>
          )}
        </div>

        <button
          type="submit"
          className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          disabled={loading}
        >
          {loading ? "Sparar…" : "Lägg till läxa till klassen"}
        </button>
      </form>
    </div>
  );
};

export default AddHomeworkAllClass;
