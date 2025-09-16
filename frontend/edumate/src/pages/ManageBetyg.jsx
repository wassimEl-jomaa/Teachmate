import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import decodeToken from "../utils/utils";

const ManageBetyg = ({ userId }) => {
  const token = localStorage.getItem("token");

  // teacher context
  const [classOptions, setClassOptions] = useState([]);            // from /subject_class_levels?user_id={teacherUserId}
  const [selectedClassLevelId, setSelectedClassLevelId] = useState("");

  // students & homeworks
  const [students, setStudents] = useState([]);                    // from /students/class_level/{id}
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentHomeworks, setStudentHomeworks] = useState([]);    // filtered from /student_homeworks
  const [selectedStudentHwId, setSelectedStudentHwId] = useState("");

  // grades
  const [allGrades, setAllGrades] = useState([]);                  // from /grades
  // Only show grades added by the logged-in teacher
  const teacherUserId = useMemo(() => {
    if (!token) return null;
    try {
      return decodeToken(token).split("|")[0];
    } catch {
      return null;
    }
  }, [token]);

  const visibleGrades = useMemo(() => {
    // Only grades created by this teacher
    const teacherGrades = allGrades.filter(g => String(g.teacher_id) === String(teacherUserId));
    if (selectedStudentHwId) {
      return teacherGrades.filter(g => String(g.student_homework_id) === String(selectedStudentHwId));
    }
    if (selectedStudentId) {
      const hwIds = new Set(studentHomeworks.map(h => h.id));
      return teacherGrades.filter(g => hwIds.has(g.student_homework_id));
    }
    return [];
  }, [allGrades, selectedStudentHwId, selectedStudentId, studentHomeworks, teacherUserId]);

  // form states
  const [newGrade, setNewGrade] = useState({ grade: "", description: "", feedback: "" });
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [editForm, setEditForm] = useState({ grade: "", description: "", feedback: "" });

  // ui
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 1) load teacher's class-levels via subject_class_levels
  useEffect(() => {
    if (!token) return;
    try {
      const msg = decodeToken(token).split("|");
      const teacherUserId = msg[0];

      (async () => {
        setLoading(true);
        const res = await axios.get(
          `http://127.0.0.1:8000/subject_class_levels?user_id=${teacherUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // unique class levels from subject_class_levels
        const options = [];
        const seen = new Set();
        for (const scl of res.data || []) {
          if (!seen.has(scl.class_level_id)) {
            seen.add(scl.class_level_id);
            options.push({
              id: scl.class_level_id,
              name: scl.class_level?.name ?? `Klass ${scl.class_level_id}`,
            });
          }
        }
        setClassOptions(options);

        // also load all grades & all student_homeworks once
        const [gradesRes, shRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/grades", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://127.0.0.1:8000/student_homeworks", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setAllGrades(gradesRes.data || []);
        setStudentHomeworks(shRes.data || []);
      })().finally(() => setLoading(false));
    } catch (e) {
      setErr(e?.response?.data?.detail || "Kunde inte ladda lärarens data.");
      setLoading(false);
    }
  }, [token]);

  // 2) when a class is selected, fetch students in that class
  useEffect(() => {
    if (!selectedClassLevelId) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get(
          `http://127.0.0.1:8000/students/class_level/${selectedClassLevelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(res.data || []);
      } catch (e) {
        setErr(e?.response?.data?.detail || "Kunde inte hämta elever.");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClassLevelId, token]);

  // 3) student => filter the student_homeworks list
  const studentHomeworksForStudent = useMemo(() => {
    if (!selectedStudentId) return [];
    return studentHomeworks.filter(sh => String(sh.student?.id) === String(selectedStudentId));
  }, [studentHomeworks, selectedStudentId]);

  // 4) add grade
  const addGrade = async (e) => {
    e.preventDefault();
    setErr("");
    if (!selectedStudentHwId) {
      setErr("Välj en läxa för eleven först.");
      return;
    }
    if (!newGrade.grade) {
      setErr("Ange betyg.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        grade: newGrade.grade,
        description: newGrade.description || null,
        feedback: newGrade.feedback || null,
        student_homework_id: Number(selectedStudentHwId),
      };
      const res = await axios.post("http://127.0.0.1:8000/grades", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllGrades(prev => [...prev, res.data]);
      setNewGrade({ grade: "", description: "", feedback: "" });
    } catch (e) {
      setErr(e?.response?.data?.detail || "Misslyckades med att lägga till betyg.");
    } finally {
      setLoading(false);
    }
  };

  // 5) start edit
  const startEdit = (g) => {
    setEditingGradeId(g.id);
    setEditForm({
      grade: g.grade || "",
      description: g.description || "",
      feedback: g.feedback || "",
    });
  };

  // 6) save edit
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingGradeId) return;
    try {
      setLoading(true);
      const res = await axios.put(
        `http://127.0.0.1:8000/grades/${editingGradeId}`,
        {
          grade: editForm.grade,
          description: editForm.description,
          feedback: editForm.feedback,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllGrades(prev => prev.map(g => (g.id === editingGradeId ? res.data : g)));
      setEditingGradeId(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Misslyckades med att uppdatera betyg.");
    } finally {
      setLoading(false);
    }
  };

  // 7) delete
  const deleteGrade = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/grades/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllGrades(prev => prev.filter(g => g.id !== id));
      if (editingGradeId === id) setEditingGradeId(null);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Misslyckades med att ta bort betyg.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Hantera Betyg</h2>

      {err && <div className="mb-4 text-red-500">{String(err)}</div>}
      {loading && <div className="mb-4 text-gray-500">Laddar...</div>}

      {/* Select class */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Klass</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedClassLevelId}
            onChange={(e) => {
              setSelectedClassLevelId(e.target.value);
              setSelectedStudentId("");
              setSelectedStudentHwId("");
            }}
          >
            <option value="">— Välj klass —</option>
            {classOptions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Select student */}
        <div>
          <label className="block text-sm font-semibold mb-1">Elev</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedStudentId}
            onChange={(e) => {
              setSelectedStudentId(e.target.value);
              setSelectedStudentHwId("");
            }}
            disabled={!selectedClassLevelId}
          >
            <option value="">— Välj elev —</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.user?.first_name} {s.user?.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Select student's homework */}
        <div>
          <label className="block text-sm font-semibold mb-1">Läxa</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedStudentHwId}
            onChange={(e) => setSelectedStudentHwId(e.target.value)}
            disabled={!selectedStudentId}
          >
            <option value="">— Välj läxa —</option>
            {studentHomeworksForStudent.map(sh => (
              <option key={sh.id} value={sh.id}>
                {sh?.homework?.title || `HW #${sh.homework_id}`} (id:{sh.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add new grade */}
      <form onSubmit={addGrade} className="mb-8">
        <h3 className="text-xl font-bold mb-3">Lägg till nytt betyg</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Betyg (t.ex. A, B, C...)"
            value={newGrade.grade}
            onChange={(e) => setNewGrade(g => ({ ...g, grade: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Beskrivning (valfritt)"
            value={newGrade.description}
            onChange={(e) => setNewGrade(g => ({ ...g, description: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Feedback (valfritt)"
            value={newGrade.feedback}
            onChange={(e) => setNewGrade(g => ({ ...g, feedback: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={!selectedStudentHwId}
        >
          Spara betyg
        </button>
      </form>

      {/* Grades list */}
      <h3 className="text-xl font-bold mb-3">Betyg</h3>
      {visibleGrades.length === 0 ? (
        <p className="text-gray-600">Inga betyg att visa.</p>
      ) : (
        <ul className="space-y-3">
          {visibleGrades.map(g => (
            <li key={g.id} className="p-4 rounded border">
              {editingGradeId === g.id ? (
                <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-4">
                  <input
                    className="border rounded px-3 py-2"
                    value={editForm.grade}
                    onChange={(e) => setEditForm(f => ({ ...f, grade: e.target.value }))}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Beskrivning"
                    value={editForm.description}
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Feedback"
                    value={editForm.feedback}
                    onChange={(e) => setEditForm(f => ({ ...f, feedback: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <button className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700" type="submit">
                      Uppdatera
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded border"
                      onClick={() => setEditingGradeId(null)}
                    >
                      Avbryt
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">
                      Betyg: {g.grade} &nbsp;
                      <span className="text-xs text-gray-500">[student_homework_id: {g.student_homework_id}]</span>
                    </div>
                    <div className="text-gray-700">Beskrivning: {g.description || "—"}</div>
                    <div className="text-gray-700">Feedback: {g.feedback || "—"}</div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => startEdit(g)}
                    >
                      Redigera
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteGrade(g.id)}
                    >
                      Radera
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageBetyg;
