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
  const [selectedHomework, setSelectedHomework] = useState(null);   // for homework details modal

  // homework viewing modal states
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [homeworkSubmission, setHomeworkSubmission] = useState(null);

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
    // Show all grades for students in the selected class, regardless of who created them
    if (selectedStudentHwId) {
      return allGrades.filter(g => String(g.student_homework_id) === String(selectedStudentHwId));
    }
    if (selectedStudentId) {
      const hwIds = new Set(studentHomeworks.map(h => h.id));
      return allGrades.filter(g => hwIds.has(g.student_homework_id));
    }
    return [];
  }, [allGrades, selectedStudentHwId, selectedStudentId, studentHomeworks]);

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
          `${process.env.REACT_APP_BACKEND_URL}/subject_class_levels?user_id=${teacherUserId}`,
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
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/grades`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/student_homeworks`, { headers: { Authorization: `Bearer ${token}` } }),
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
          `${process.env.REACT_APP_BACKEND_URL}/students/class_level/${selectedClassLevelId}`,
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

  // View homework details
  const viewHomework = async (studentHomework) => {
    try {
      setLoading(true);
      setSelectedHomework(studentHomework);
      
      // Fetch homework submission if exists
      try {
        const submissionRes = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/homework_submissions/?student_homework_id=${studentHomework.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (submissionRes.data && submissionRes.data.length > 0) {
          const submission = submissionRes.data[0];
          
          // If there's a file, fetch file details
          if (submission.submission_file_id) {
            try {
              const fileRes = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/file_attachments/${submission.submission_file_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              submission.file_details = fileRes.data;
            } catch (fileErr) {
              console.log("Could not fetch file details:", fileErr);
            }
          }
          
          setHomeworkSubmission(submission);
        } else {
          setHomeworkSubmission(null);
        }
      } catch (submissionErr) {
        console.log("No submission found or error:", submissionErr);
        setHomeworkSubmission(null);
      }
      
      setShowHomeworkModal(true);
    } catch (e) {
      setErr("Kunde inte ladda läxdetaljer.");
    } finally {
      setLoading(false);
    }
  };

  const closeHomeworkModal = () => {
    setShowHomeworkModal(false);
    setSelectedHomework(null);
    setHomeworkSubmission(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("sv-SE");
  };

  // Add function to download/view files
  const handleViewSubmissionFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/files/${fileId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'submission_file';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setErr('Kunde inte ladda ner filen.');
    }
  };

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
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/grades`, payload, {
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
        `${process.env.REACT_APP_BACKEND_URL}/grades/${editingGradeId}`,
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
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/grades/${id}`, {
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
    onChange={(e) => {
      setSelectedStudentHwId(e.target.value);
      const selectedHw = studentHomeworksForStudent.find(
        (sh) => String(sh.id) === e.target.value
      );
      setSelectedHomework(selectedHw || null);
      setHomeworkSubmission(null); // Reset submission details
      if (selectedHw) {
        viewHomework(selectedHw); // Fetch and display homework details
      }
    }}
    disabled={!selectedStudentId}
  >
    <option value="">— Välj läxa —</option>
    {studentHomeworksForStudent.map((sh) => (
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

      {/* Homework Detail Modal */}
      {showHomeworkModal && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedHomework.homework?.title || "Okänd läxa"}
                  </h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedHomework.homework?.priority === "high" 
                        ? "bg-red-100 text-red-700" 
                        : selectedHomework.homework?.priority === "low"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {selectedHomework.homework?.priority || "Normal"}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedHomework.is_completed 
                        ? "text-green-700 bg-green-100 ring-1 ring-green-200"
                        : "text-amber-700 bg-amber-100 ring-1 ring-amber-200"
                    }`}>
                      {selectedHomework.is_completed ? "✅ Slutförd" : "⏳ Ej slutförd"}
                    </span>
                    {homeworkSubmission && (
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 ring-1 ring-blue-200 px-2 py-1 rounded-full text-xs font-semibold">
                        📝 Svar inlämnat
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeHomeworkModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Homework Details */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Beskrivning</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedHomework.homework?.description || "Ingen beskrivning tillgänglig"}
                      </p>
                    </div>
                  </div>

                  {/* Due Date and Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📅 Förfallodatum</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-800">
                          {formatDate(selectedHomework.homework?.due_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📚 Status</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">
                          {selectedHomework.homework?.status || "Ej angivet"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">👤 Elev</h3>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-blue-800">
                        {selectedHomework.student?.user?.first_name} {selectedHomework.student?.user?.last_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Student Submission */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ Elevens Svar</h3>
                    
                    {homeworkSubmission ? (
                      <div className="space-y-4">
                        {/* Submission text */}
                        {homeworkSubmission.submission_text && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Elevens textssvar:</p>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {homeworkSubmission.submission_text}
                            </p>
                          </div>
                        )}

                        {/* Submitted File with details */}
                        {homeworkSubmission.submission_file_id && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Inlämnad fil:</p>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-blue-600">📎</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {homeworkSubmission.file_details?.file_name || `submission_${homeworkSubmission.id}`}
                                  </span>
                                </div>
                                {homeworkSubmission.file_details && (
                                  <div className="text-xs text-gray-500 ml-5">
                                    <div>Beskrivning: {homeworkSubmission.file_details.description || 'Ingen beskrivning'}</div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleViewSubmissionFile(
                                  homeworkSubmission.submission_file_id,
                                  homeworkSubmission.file_details?.file_name || `submission_${homeworkSubmission.id}`
                                )}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors ml-3"
                              >
                                📥 Ladda ner
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Show message if no text or file */}
                        {!homeworkSubmission.submission_text && !homeworkSubmission.submission_file_id && (
                          <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <p className="text-gray-600">
                              Eleven har skickat in läxan men utan text eller fil.
                            </p>
                          </div>
                        )}

                        {/* Submission info */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Inlämnat: {formatDate(homeworkSubmission.submission_date)}</div>
                          <div>Status: {homeworkSubmission.status}</div>
                          <div className={`${homeworkSubmission.is_late === "Yes" ? "text-red-600" : "text-green-600"}`}>
                            {homeworkSubmission.is_late === "Yes" ? "⚠️ Sent inlämnat" : "✅ I tid"}
                          </div>
                        </div>

                        {/* Teacher feedback section */}
                        {homeworkSubmission.teacher_feedback && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-gray-600 mb-2">Din feedback:</p>
                            <p className="text-yellow-800">
                              {homeworkSubmission.teacher_feedback}
                            </p>
                          </div>
                        )}

                        {/* Grade */}
                        {homeworkSubmission.grade_value && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-2">Betyg:</p>
                            <p className="text-green-800 font-semibold text-lg">
                              {homeworkSubmission.grade_value}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <p className="text-gray-600">
                          Eleven har inte lämnat in något svar än.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedStudentHwId(selectedHomework.id);
                    closeHomeworkModal();
                  }}
                  className="flex-1 py-2.5 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  📊 Sätt Betyg på denna Läxa
                </button>
                <button
                  onClick={closeHomeworkModal}
                  className="flex-1 py-2.5 rounded-lg font-semibold bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBetyg;