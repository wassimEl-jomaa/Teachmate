import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import decodeToken from "../utils/utils";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // Import useNavigate
/* ------------------------------ helpers ------------------------------ */
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
 
const overdue = (iso, completed) => !completed && iso && new Date(iso) < new Date();

const priorityBadge = (p) => {
  switch ((p || "").toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case "low":
      return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    default:
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
  }
};

/* Small UI atoms */
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
);

const StatCard = ({ label, value, className = "", emoji }) => (
  <div className={`rounded-2xl bg-white p-5 shadow-sm border ${className}`}>
    <p className="text-slate-500 text-sm flex items-center gap-2">
      <span className="text-base">{emoji}</span> {label}
    </p>
    <p className="text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
  </div>
);

const PillButton = ({ active, children, onClick, activeClass = "bg-blue-600 text-white border-blue-600", baseClass = "bg-white text-slate-700 border-slate-300 hover:bg-slate-50" }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${active ? activeClass : baseClass}`}
  >
    {children}
  </button>
);

/* ------------------------------ Component ------------------------------ */
const MinSida = ({ userId }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal & submission state
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [homeworkSubmission, setHomeworkSubmission] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // Submission form
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  

  // Filters / sort / search
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState("due");

  // Feedback
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const handleNavigateToAIScoring = () => {
  if (!homeworkSubmission) {
    console.error("homeworkSubmission is not defined");
    setErrorMessage("Ingen inlämning hittades för att skicka till AI-analys.");
    return;
  }

  if (homeworkSubmission.submission_text) {
    navigate("/aiscoring", { state: { submissionText: homeworkSubmission.submission_text } });
  } else {
    setErrorMessage("Ingen text att skicka till AI-analys.");
  }
};
  /* ------------------------------ Effects ------------------------------ */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        const [userIdRaw] = decodeToken(token).split("|");
        const parsedUserId = parseInt(userIdRaw, 10);

        const studentRes = await axios.get(
          `http://127.0.0.1:8000/students/by_user/${parsedUserId}`,
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
        setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-fetch feedback when a submission is present
  useEffect(() => {
  const fetchFeedback = async () => {
    if (!homeworkSubmission?.id) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/homework_submissions/${homeworkSubmission.id}/feedback`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFeedback(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn("No feedback found for this submission.");
        setFeedback(null); // Set feedback to null if not found
      } else {
        console.error("Failed to fetch feedback:", error);
        setErrorMessage("Kunde inte hämta AI-feedback. Försök igen senare.");
      }
    }
  };

  fetchFeedback();
}, [homeworkSubmission]);

  /* ------------------------------ Derived ------------------------------ */
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

  /* ------------------------------ Actions ------------------------------ */
  const handleMarkAsComplete = async (studentHomeworkId) => {
    setBusyId(studentHomeworkId);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://127.0.0.1:8000/student_homeworks/${studentHomeworkId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHomeworks((prev) => prev.map((h) => (h.id === studentHomeworkId ? { ...h, is_completed: true } : h)));
    } catch (err) {
      console.error("Error marking as complete:", err);
      setErrorMessage("Kunde inte markera som klar. Försök igen.");
    } finally {
      setBusyId(null);
    }
  };
  const fetchAIFeedback = async (submissionText) => {
  try {
    setLoadingFeedback(true);
    const token = localStorage.getItem("token");

    const response = await axios.post(
      "http://127.0.0.1:8000/api/ml/score-text",
      { text: submissionText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setFeedback(response.data);
  } catch (error) {
    console.error("Failed to fetch AI feedback:", error);
    setErrorMessage("Kunde inte generera AI-feedback. Försök igen senare.");
  } finally {
    setLoadingFeedback(false);
  }
};
  const fetchOrGenerateFeedback = async () => {
    if (!homeworkSubmission?.id) {
      setErrorMessage("Ingen inlämning hittades för att generera eller hämta AI-feedback.");
      return;
    }

    setLoadingFeedback(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");

      // Try POST (generate feedback)
      try {
        const postResponse = await axios.post(
          `http://127.0.0.1:8000/homework_submissions/${homeworkSubmission.id}/generate-feedback`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFeedback(postResponse.data);
        return;
      } catch (postError) {
        if (postError.response?.status !== 404) {
          throw postError;
        }
        console.warn("POST failed, falling back to GET...");
      }

      // Fallback to GET
      try {
        const getResponse = await axios.get(
          `http://127.0.0.1:8000/homework_submissions/${homeworkSubmission.id}/feedback`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFeedback(getResponse.data);
      } catch (getError) {
        if (getError.response?.status === 404) {
          setErrorMessage("Ingen AI-feedback hittades och kunde inte genereras.");
        } else {
          throw getError;
        }
      }
    } catch (error) {
      console.error("Failed to generate or fetch feedback:", error);
      setErrorMessage("Kunde inte generera eller hämta AI-feedback. Försök igen senare.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const viewHomework = async (studentHomework) => {
  try {
    setLoadingSubmission(true);
    setSelectedHomework(studentHomework);

    const token = localStorage.getItem("token");
    const submissionRes = await axios.get(
      `http://127.0.0.1:8000/homework_submissions/?student_homework_id=${studentHomework.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (submissionRes.data && submissionRes.data.length > 0) {
      const submission = submissionRes.data[0];
      console.log("Setting homeworkSubmission:", submission); // Debugging log
      setHomeworkSubmission(submission); // Ensure this is setting the state
    } else {
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
      const response = await axios.get(`http://127.0.0.1:8000/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "submission_file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      setErrorMessage("Kunde inte ladda ner filen.");
    }
  };

  const handleSubmitHomework = async (e) => {
  e.preventDefault();

  if (!submissionText.trim() && !submissionFile) {
    setErrorMessage("Du måste ange text eller välja en fil att lämna in.");
    return;
  }

  setErrorMessage("");

  try {
    const token = localStorage.getItem("token");
    let fileId = null;

    // Upload file if provided
    if (submissionFile) {
      const formData = new FormData();
      formData.append("file", submissionFile);
      formData.append(
        "description",
        `Inlämning för ${selectedHomework.homework?.title || "läxa"}`
      );

      try {
        const fileUploadRes = await axios.post("http://127.0.0.1:8000/file_attachments", formData, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        fileId = fileUploadRes.data.id;
      } catch (fileError) {
        if (submissionText.trim()) {
          const continueWithoutFile = window.confirm(
            "Filuppladdningen misslyckades. Vill du fortsätta med bara textsvar?"
          );
          if (!continueWithoutFile) {
            throw new Error("Filuppladdning avbruten av användaren.");
          }
          fileId = null;
        } else {
          throw new Error(
            "Kunde inte ladda upp filen. " + (fileError.response?.data?.detail || fileError.message)
          );
        }
      }
    }

    // Check if submission is late
    const dueDate = new Date(selectedHomework.homework?.due_date);
    const submissionDate = new Date();
    const isLate = submissionDate > dueDate ? "Yes" : "No";

    const studentHomeworkId = selectedHomework.id;
    if (!studentHomeworkId) {
      throw new Error("Kunde inte hitta student_homework_id. Kontrollera att läxan är korrekt vald.");
    }

    const submissionData = {
      student_homework_id: parseInt(studentHomeworkId, 10),
      submission_text: submissionText.trim() || "",
      submission_file_id: fileId,
      submission_date: new Date().toISOString().split("T")[0],
      status: "submitted",
      is_late: isLate,
    };

    const submissionRes = await axios.post("http://127.0.0.1:8000/homework_submissions/", submissionData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 15000,
    });

    setHomeworkSubmission(submissionRes.data);
    setShowSubmissionForm(false);
    setSubmissionText("");
    setSubmissionFile(null);

    await handleMarkAsComplete(selectedHomework.id);
    setErrorMessage("");

    // Automatically send the submission text to ScoreAssist for AI feedback
    await fetchAIFeedback(submissionRes.data.submission_text);

  } catch (error) {
    console.error("Error submitting homework:", error);
    setErrorMessage(error.message || "Kunde inte lämna in läxan. Försök igen.");
  }
};

  const toggleSubmissionForm = () => {
    setShowSubmissionForm(!showSubmissionForm);
    setSubmissionText("");
    setSubmissionFile(null);
    setErrorMessage("");
  };

  /* ------------------------------ Render helpers ------------------------------ */
  const renderFeedback = (fb) => {
    if (loadingFeedback) {
      return (
        <div className="flex items-center gap-2 text-slate-600"><span className="animate-spin h-4 w-4 border-b-2 border-slate-600 rounded-full inline-block"/> Laddar AI-feedback…</div>
      );
    }

    if (!fb) return <p className="text-slate-600">Ingen AI-feedback ännu. Klicka ”Hämta”.</p>;

    // If array of objects (feedback history or multiple items)
    if (Array.isArray(fb)) {
      if (fb.length === 0) return <p className="text-slate-600">Ingen AI-feedback tillgänglig.</p>;
      return (
        <ul className="list-disc pl-5 space-y-2 text-slate-800">
          {fb.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item.feedback_text && <p><span className="font-medium">Feedback:</span> {item.feedback_text}</p>}
              {item.improvement_suggestions && <p><span className="font-medium">Förbättringar:</span> {item.improvement_suggestions}</p>}
              {!item.feedback_text && !item.improvement_suggestions && (
                <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-2 rounded border border-slate-200">{JSON.stringify(item, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      );
    }

    // If object with comments/overall
    if (typeof fb === "object") {
      return (
        <div className="space-y-3">
          {Array.isArray(fb.comments) && fb.comments.length > 0 && (
            <ul className="list-disc pl-5 space-y-2 text-slate-800">
              {fb.comments.map((c, i) => (
                <li key={i}>{typeof c === "string" ? c : JSON.stringify(c)}</li>
              ))}
            </ul>
          )}
          {(fb.overall || fb.text) && (
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">{fb.overall || fb.text}</pre>
          )}
          {!fb.comments && !fb.overall && !fb.text && (
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">{JSON.stringify(fb, null, 2)}</pre>
          )}
        </div>
      );
    }

    // If plain string
    return <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">{String(fb)}</pre>;
  };

  /* ------------------------------ UI ------------------------------ */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
        <p className="mt-4 text-blue-700 font-semibold">Laddar din sida…</p>
      </div>
    );
  }

  if (errorMessage && !showHomeworkModal) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-6 py-4 shadow">⚠️ {errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 border-r border-blue-200 p-6 sticky top-0">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Meny</h2>
          <nav className="space-y-2">
            <Link to="/minbetyg" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">Betyg</Link>
            <Link to="/minmeddelande" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">Meddelande</Link>
            <Link to="/minfeedback" className="block py-2 px-3 rounded-md hover:bg-blue-200/60 text-blue-800 font-medium">Feedback</Link>
            <Link to="/ai-suggestions" className="block py-2 px-3 rounded-md hover:bg-purple-200/60 text-purple-800 font-medium">AI-förslag</Link>
            <Link to="/recommended-resources" className="block py-2 px-3 rounded-md hover:bg-green-200/60 text-green-800 font-medium">Rekommenderade Resurser</Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-10">
          {/* Hero */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Totalt" value={total} emoji="📦" className="border-slate-200" />
            <StatCard label="Klara" value={done} emoji="✅" className="border-green-200" />
            <StatCard label="Ej klara" value={pending} emoji="⏳" className="border-amber-200" />
            <StatCard label="Försenade" value={late} emoji="⚠️" className="border-red-200" />
          </div>

          {/* Filters & Search */}
          <div className="sticky top-0 z-10 mb-6 bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="flex gap-2">
              <PillButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>Alla</PillButton>
              <PillButton active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} activeClass="bg-amber-500 text-white border-amber-500">Ej klara</PillButton>
              <PillButton active={statusFilter === "completed"} onClick={() => setStatusFilter("completed")} activeClass="bg-green-600 text-white border-green-600">Klara</PillButton>
            </div>

            <div className="flex gap-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700"
              >
                <option value="all">Alla prioriteter</option>
                <option value="High">Hög</option>
                <option value="Normal">Normal</option>
                <option value="Low">Låg</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700"
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
                  className="pl-10 pr-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 w-56"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Homework List */}
          <h2 className="text-2xl font-semibold mb-4 text-slate-700">📚 Mina Läxor</h2>

          {visibleHomeworks.length === 0 ? (
            <div className="text-slate-500 italic bg-white border border-slate-200 rounded-2xl p-6 text-center">
              Inga läxor matchar dina filter.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleHomeworks.map((shw) => {
                const hw = shw.homework || {};
                const isDone = shw.is_completed || hw.status === "completed";
                const isLate = overdue(hw.due_date, isDone);
                const dueLabel = fmtDate(hw.due_date);

                return (
                  <div key={shw.id} className="group border border-slate-200 p-6 rounded-2xl shadow-sm bg-white hover:shadow-lg hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{hw.title}</h3>
                      <Badge className={priorityBadge(hw.priority)}>{hw.priority || "Normal"}</Badge>
                    </div>

                    <p className="text-slate-600 mb-4 line-clamp-3">{hw.description}</p>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Förfallodatum:</span>
                        <span className={`font-medium ${isLate ? "text-red-600" : "text-slate-800"}`}>{dueLabel}</span>
                      </div>
                      {isLate && !isDone && <span className="text-red-600 text-xs font-semibold">Försenad</span>}
                    </div>

                    <div className="mb-4">
                      {isDone ? (
                        <Badge className="text-green-700 bg-green-100 ring-1 ring-green-200">✅ Klar</Badge>
                      ) : (
                        <Badge className="text-amber-700 bg-amber-100 ring-1 ring-amber-200">⏳ Ej klar</Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => viewHomework(shw)} className="flex-1 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm">📖 Visa Läxa</button>
                      {!isDone && (
                        <button
                          onClick={() => handleMarkAsComplete(shw.id)}
                          disabled={busyId === shw.id}
                          className={`flex-1 py-2.5 rounded-lg font-semibold shadow transition-colors text-sm ${busyId === shw.id ? "bg-green-300 text-white cursor-wait" : "bg-green-600 hover:bg-green-700 text-white"}`}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-200 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedHomework.homework?.title || "Okänd läxa"}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={priorityBadge(selectedHomework.homework?.priority)}>
                    {selectedHomework.homework?.priority || "Normal"}
                  </Badge>
                  <Badge className={`${selectedHomework.is_completed || selectedHomework.homework?.status === "completed" ? "text-green-700 bg-green-100 ring-1 ring-green-200" : "text-amber-700 bg-amber-100 ring-1 ring-amber-200"}`}>
                    {selectedHomework.is_completed || selectedHomework.homework?.status === "completed" ? "✅ Slutförd" : "⏳ Ej slutförd"}
                  </Badge>
                  {homeworkSubmission && (
                    <Badge className="text-blue-700 bg-blue-100 ring-1 ring-blue-200">📝 Svar inlämnat</Badge>
                  )}
                  {feedback && <Badge className="text-purple-700 bg-purple-100 ring-1 ring-purple-200">🤖 AI-feedback</Badge>}
                </div>
              </div>
              <button onClick={closeHomeworkModal} className="text-slate-500 hover:text-slate-700 text-2xl font-bold">×</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">⚠️ {typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)}</div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column: description, grade, teacher feedback, AI feedback */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">📝 Beskrivning</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-slate-800 whitespace-pre-wrap">{selectedHomework.homework?.description || "Ingen beskrivning tillgänglig"}</p>
                    </div>
                  </div>

                  {/* Grade */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">📊 Betyg</h3>
                    {homeworkSubmission?.grade_value ? (
                      <p className="text-slate-800 text-lg font-bold">{homeworkSubmission.grade_value}</p>
                    ) : (
                      <p className="text-slate-600 italic">Inget betyg tillgängligt.</p>
                    )}
                  </div>

                  {/* Teacher Feedback */}
                  {homeworkSubmission?.teacher_feedback && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">📝 Lärarens Feedback</h3>
                      <p className="text-yellow-900 whitespace-pre-wrap">{homeworkSubmission.teacher_feedback}</p>
                    </div>
                  )}

                  {/* AI Feedback */}
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">🤖 AI-feedback</h3>
                      <button
                        onClick={fetchOrGenerateFeedback}
                        disabled={loadingFeedback || !homeworkSubmission?.grade_value} // Inaktivera om inget betyg finns
                        className={`px-3 py-1.5 rounded-md ${
                          homeworkSubmission?.grade_value
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {loadingFeedback
                          ? "Bearbetar…"
                          : homeworkSubmission?.grade_value
                          ? feedback
                            ? "Uppdatera"
                            : "Hämta"
                          : "Betyg krävs"}
                      </button>
                    </div>
                    <div className="mt-3">
                    {homeworkSubmission?.grade_value ? (
                      renderFeedback(feedback)
                    ) : (
                      <p className="text-slate-600 italic">
                        AI-feedback är inaktiverad tills ett betyg har tilldelats.
                      </p>
                    )}
                  </div>
                  </div>
                </div>

                {/* Right column: student submission */}
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">✍️ Mitt Svar</h3>
                    {loadingSubmission ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-6 w-6 border-b-2 border-blue-600 rounded-full mx-auto"></div>
                        <p className="text-slate-600 mt-2">Laddar svar...</p>
                      </div>
                    ) : homeworkSubmission ? (
                      <div className="space-y-4">
                        {homeworkSubmission.submission_text && (
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-2">Mitt textsvar:</p>
                            <p className="text-slate-900 whitespace-pre-wrap">{homeworkSubmission.submission_text}</p>
                          </div>
                        )}

                        {homeworkSubmission.submission_file_id && (
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-2">Min inlämnade fil:</p>
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-blue-600">📎</span>
                                  <span className="text-sm font-medium text-slate-700">{homeworkSubmission.file_details?.file_name || `Fil ID: ${homeworkSubmission.submission_file_id}`}</span>
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

                        <div className="text-xs text-slate-600 space-y-1">
                          <div>Inlämnat: {fmtDate(homeworkSubmission.submission_date)}</div>
                          <div>Status: {homeworkSubmission.status}</div>
                          <div className={`${homeworkSubmission.is_late === "Yes" ? "text-red-600" : "text-green-600"}`}>
                            {homeworkSubmission.is_late === "Yes" ? "⚠️ Sent inlämnat" : "✅ I tid"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      !showSubmissionForm ? (
                        <div className="bg-slate-100 p-4 rounded-lg text-center">
                          <p className="text-slate-600 mb-3">Du har inte lämnat in något svar än.</p>
                          <button onClick={toggleSubmissionForm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">📝 Lämna in svar</button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitHomework} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Textsvar (valfritt):</label>
                            <textarea
                              value={submissionText}
                              onChange={(e) => setSubmissionText(e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows="6"
                              placeholder="Skriv ditt svar här..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Fil (valfritt):</label>
                            <input
                              type="file"
                              onChange={(e) => setSubmissionFile(e.target.files[0])}
                              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            />
                            {submissionFile && <p className="text-sm text-slate-600 mt-1">Vald fil: {submissionFile.name}</p>}
                          </div>

                          <div className="flex gap-3">
                            <button type="submit" className="flex-1 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">📝 Lämna in Svar</button>
                            <button type="button" onClick={toggleSubmissionForm} className="flex-1 py-2.5 rounded-lg font-semibold bg-slate-300 hover:bg-slate-400 text-slate-700 transition-colors">Avbryt</button>
                          </div>
                        </form>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              {!homeworkSubmission && !showSubmissionForm && (
                <button onClick={toggleSubmissionForm} className="flex-1 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors">📝 Lämna in Svar</button>
              )}
              <button onClick={closeHomeworkModal} className="flex-1 py-2.5 rounded-lg font-semibold bg-slate-300 hover:bg-slate-400 text-slate-700 transition-colors">Stäng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinSida;
