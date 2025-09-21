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

const MinSida = ({ userId }) => {
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Homework viewing modal states
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkSubmission, setHomeworkSubmission] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Submission form states
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("due");

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
        console.error("Error fetching data:", err);
        const msg = err.response?.data?.detail || err.message || "Något gick fel";
        setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (h) =>
          h.homework?.title?.toLowerCase().includes(q) ||
          h.homework?.description?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "pending") {
      list = list.filter((h) => !(h.is_completed || h.homework?.status === "completed"));
    } else if (statusFilter === "completed") {
      list = list.filter((h) => h.is_completed || h.homework?.status === "completed");
    }

    if (priorityFilter !== "all") {
      list = list.filter(
        (h) => (h.homework?.priority || "Normal").toLowerCase() === priorityFilter.toLowerCase()
      );
    }

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

  const handleMarkAsComplete = async (studentHomeworkId) => {
    setBusyId(studentHomeworkId);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://127.0.0.1:8000/student_homeworks/${studentHomeworkId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHomeworks((prev) =>
        prev.map((h) =>
          h.id === studentHomeworkId ? { ...h, is_completed: true } : h
        )
      );
    } catch (err) {
      console.error("Error marking as complete:", err);
      setErrorMessage("Kunde inte markera som klar. Försök igen.");
    } finally {
      setBusyId(null);
    }
  };

  const viewHomework = async (studentHomework) => {
    try {
      setLoadingSubmission(true);
      setSelectedHomework(studentHomework);
      
      const token = localStorage.getItem("token");
      try {
        const submissionRes = await axios.get(
          `http://127.0.0.1:8000/homework_submissions/?student_homework_id=${studentHomework.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (submissionRes.data && submissionRes.data.length > 0) {
          const submission = submissionRes.data[0];
          
          if (submission.submission_file_id) {
            try {
              const fileRes = await axios.get(
                `http://127.0.0.1:8000/file_attachments/${submission.submission_file_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              submission.file_details = fileRes.data;
            } catch (fileErr) {
              console.log("Could not fetch file details:", fileErr);
              submission.file_details = {
                file_name: `submission_file_${submission.submission_file_id}`,
                description: 'Inlämnad fil'
              };
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
      console.error("Error viewing homework:", e);
      setErrorMessage("Kunde inte ladda läxdetaljer.");
    } finally {
      setLoadingSubmission(false);
    }
  };

  const closeHomeworkModal = () => {
    setShowHomeworkModal(false);
    setSelectedHomework(null);
    setHomeworkSubmission(null);
    setShowSubmissionForm(false);
    setSubmissionText("");
    setSubmissionFile(null);
    setErrorMessage("");
  };

  const handleViewSubmissionFile = async (fileId, fileName) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://127.0.0.1:8000/files/${fileId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
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
      setErrorMessage('Kunde inte ladda ner filen.');
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    
    if (!submissionText.trim() && !submissionFile) {
      setErrorMessage("Du måste ange text eller välja en fil att lämna in.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      let fileId = null;

      // Upload file if provided
      if (submissionFile) {
        const formData = new FormData();
        formData.append('file', submissionFile);
        formData.append('description', `Inlämning för ${selectedHomework.homework?.title || 'läxa'}`);

        try {
          console.log("Uploading file:", submissionFile.name);
          const fileUploadRes = await axios.post(
            'http://127.0.0.1:8000/file_attachments',
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              timeout: 30000 // 30 second timeout
            }
          );
          fileId = fileUploadRes.data.id;
          console.log("File uploaded successfully with ID:", fileId);
        } catch (fileError) {
          console.error("File upload error:", fileError);
          console.error("File upload response:", fileError.response?.data);
          
          // If file upload fails, ask user if they want to continue with text only
          if (submissionText.trim()) {
            const continueWithoutFile = window.confirm(
              "Filuppladdningen misslyckades. Vill du fortsätta med bara textsvar?"
            );
            if (!continueWithoutFile) {
              throw new Error("Filuppladdning avbruten av användaren.");
            }
            // Continue without file
            fileId = null;
          } else {
            throw new Error("Kunde inte ladda upp filen. " + (fileError.response?.data?.detail || fileError.message));
          }
        }
      }

      // Debug: Log the selectedHomework object to see its structure
      console.log("Full selectedHomework object:", selectedHomework);
      console.log("selectedHomework.id:", selectedHomework.id);
      console.log("selectedHomework keys:", Object.keys(selectedHomework));

      // Check if submission is late
      const dueDate = new Date(selectedHomework.homework?.due_date);
      const submissionDate = new Date();
      const isLate = submissionDate > dueDate ? "Yes" : "No";

      // Create homework submission with corrected data structure
      const studentHomeworkId = selectedHomework.id;
      
      if (!studentHomeworkId) {
        throw new Error("Kunde inte hitta student_homework_id. Kontrollera att läxan är korrekt vald.");
      }

      const submissionData = {
        student_homework_id: parseInt(studentHomeworkId, 10),
        submission_text: submissionText.trim() || "",
        submission_file_id: fileId,
        submission_date: new Date().toISOString().split('T')[0],
        status: "submitted",
        is_late: isLate
      };

      console.log("Submission data being sent:", submissionData);

      try {
        const submissionRes = await axios.post(
          'http://127.0.0.1:8000/homework_submissions/',
          submissionData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 second timeout
          }
        );

        console.log("Submission response:", submissionRes.data);

        // Update the homework submission state
        setHomeworkSubmission(submissionRes.data);
        setShowSubmissionForm(false);
        setSubmissionText("");
        setSubmissionFile(null);

        // Mark homework as completed
        await handleMarkAsComplete(selectedHomework.id);

        setErrorMessage("");
        alert("Läxan har lämnats in framgångsrikt!");

      } catch (submissionError) {
        console.error("Submission creation error:", submissionError);
        console.error("Submission response data:", submissionError.response?.data);
        
        let errorMsg = "Kunde inte skapa inlämningen.";
        if (submissionError.response?.data?.detail) {
          if (Array.isArray(submissionError.response.data.detail)) {
            const validationErrors = submissionError.response.data.detail.map(err => 
              `${err.loc.join('.')}: ${err.msg}`
            ).join(', ');
            errorMsg += ` Validation errors: ${validationErrors}`;
          } else {
            errorMsg += ` ${submissionError.response.data.detail}`;
          }
        }
        throw new Error(errorMsg);
      }

    } catch (error) {
      console.error('Error submitting homework:', error);
      setErrorMessage(error.message || 'Kunde inte lämna in läxan. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSubmissionForm = () => {
    setShowSubmissionForm(!showSubmissionForm);
    setSubmissionText("");
    setSubmissionFile(null);
    setErrorMessage("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
        <p className="mt-4 text-blue-700 font-semibold">Laddar din sida…</p>
      </div>
    );
  }

  // Error state (only show if not in modal)
  if (errorMessage && !showHomeworkModal) {
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

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-10">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white p-8 shadow-xl mb-8">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <h1 className="text-4xl font-extrabold tracking-tight">Min Sida</h1>
            {student && (
              <p className="mt-2 text-blue-100 text-lg">
                Välkommen, <span className="font-semibold">{student.user?.first_name} {student.user?.last_name}</span> 👋
              </p>
            )}
            <p className="text-blue-100/90">Här får du full koll på dina läxor.</p>
          </div>

          {/* Stats Cards */}
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

          {/* Filters and Search */}
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

          {/* Homework List */}
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewHomework(shw)}
                        className="flex-1 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm"
                      >
                        📖 Visa Läxa
                      </button>
                      
                      {!isDone && (
                        <button
                          onClick={() => handleMarkAsComplete(shw.id)}
                          disabled={busyId === shw.id}
                          className={`flex-1 py-2.5 rounded-lg font-semibold shadow transition-colors text-sm
                            ${busyId === shw.id ? "bg-green-300 text-white cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"}`}
                        >
                          {busyId === shw.id ? "Markerar…" : "✅ Klar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

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
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityBadge(selectedHomework.homework?.priority)}`}>
                      {selectedHomework.homework?.priority || "Normal"}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedHomework.is_completed || selectedHomework.homework?.status === "completed"
                        ? "text-green-700 bg-green-100 ring-1 ring-green-200"
                        : "text-amber-700 bg-amber-100 ring-1 ring-amber-200"
                    }`}>
                      {selectedHomework.is_completed || selectedHomework.homework?.status === "completed" ? "✅ Slutförd" : "⏳ Ej slutförd"}
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

              {/* Error Display */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  ⚠️ {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Homework Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Beskrivning</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedHomework.homework?.description || "Ingen beskrivning tillgänglig"}
                      </p>
                    </div>
                  </div>

                  {/* Due Date and Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📅 Förfallodatum</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-800">
                          {fmtDate(selectedHomework.homework?.due_date)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">📚 Status</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">
                          {selectedHomework.homework?.status || "Tilldelad"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Student Submission Section */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ Mitt Svar</h3>
                    
                    {loadingSubmission ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full mx-auto"></div>
                        <p className="text-gray-600 mt-2">Laddar svar...</p>
                      </div>
                    ) : homeworkSubmission ? (
                      <div className="space-y-4">
                        {/* Existing submission display */}
                        {homeworkSubmission.submission_text && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Mitt textssvar:</p>
                            <p className="text-gray-800 whitespace-pre-wrap">
                              {homeworkSubmission.submission_text}
                            </p>
                          </div>
                        )}

                        {homeworkSubmission.submission_file_id && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Min inlämnade fil:</p>
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-blue-600">📎</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {homeworkSubmission.file_details?.file_name || `Fil ID: ${homeworkSubmission.submission_file_id}`}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewSubmissionFile(
                                  homeworkSubmission.submission_file_id,
                                  homeworkSubmission.file_details?.file_name || `min_inlamning_${homeworkSubmission.id}`
                                )}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors ml-3"
                              >
                                📥 Ladda ner
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Inlämnat: {fmtDate(homeworkSubmission.submission_date)}</div>
                          <div>Status: {homeworkSubmission.status}</div>
                          <div className={`${homeworkSubmission.is_late === "Yes" ? "text-red-600" : "text-green-600"}`}>
                            {homeworkSubmission.is_late === "Yes" ? "⚠️ Sent inlämnat" : "✅ I tid"}
                          </div>
                        </div>

                        {homeworkSubmission.teacher_feedback && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-gray-600 mb-2">Lärarens feedback:</p>
                            <p className="text-yellow-800">
                              {homeworkSubmission.teacher_feedback}
                            </p>
                          </div>
                        )}

                        {homeworkSubmission.grade_value && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-2">Betyg:</p>
                            <p className="text-green-800 font-semibold text-lg">
                              {homeworkSubmission.grade_value}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : showSubmissionForm ? (
                      /* Submission Form */
                      <form onSubmit={handleSubmitHomework} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Textssvar (valfritt):
                          </label>
                          <textarea
                            value={submissionText}
                            onChange={(e) => setSubmissionText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="6"
                            placeholder="Skriv ditt svar här..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fil (valfritt):
                          </label>
                          <input
                            type="file"
                            onChange={(e) => setSubmissionFile(e.target.files[0])}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                          />
                          {submissionFile && (
                            <p className="text-sm text-gray-600 mt-1">
                              Vald fil: {submissionFile.name}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={submitting}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                              submitting 
                                ? "bg-blue-300 text-white cursor-wait" 
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {submitting ? "Lämnar in..." : "📝 Lämna in Svar"}
                          </button>
                          <button
                            type="button"
                            onClick={toggleSubmissionForm}
                            className="flex-1 py-2.5 rounded-lg font-semibold bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
                          >
                            Avbryt
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <p className="text-gray-600 mb-3">
                          Du har inte lämnat in något svar än.
                        </p>
                        <button
                          onClick={toggleSubmissionForm}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          📝 Lämna in svar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex gap-3">
                {!homeworkSubmission && !showSubmissionForm && (
                  <button
                    onClick={toggleSubmissionForm}
                    className="flex-1 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    📝 Lämna in Svar
                  </button>
                )}
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

export default MinSida;