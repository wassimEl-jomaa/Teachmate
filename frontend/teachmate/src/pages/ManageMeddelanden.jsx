import React, { useState, useEffect } from "react";
import axios from "axios";

const Badge = ({ children, tone = "blue" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${tone}-100 text-${tone}-800`}
  >
    {children}
  </span>
);

const Alert = ({ type = "success", message, onClose }) => {
  const palette = {
    success: {
      bg: "bg-green-50",
      text: "text-green-800",
      ring: "ring-green-200",
      icon: "✅",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-800",
      ring: "ring-red-200",
      icon: "⚠️",
    },
  };
  const p = palette[type];

  if (!message) return null;
  return (
    <div
      className={`${p.bg} ${p.text} ring-1 ${p.ring} rounded-lg p-3 flex items-start gap-3 animate-[fadeIn_200ms_ease-in-out]`}
    >
      <div className="text-lg">{p.icon}</div>
      <div className="flex-1 text-sm">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs opacity-70 hover:opacity-100"
      >
        Stäng
      </button>
    </div>
  );
};

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

const ManageMeddelanden = () => {
  const [meddelanden, setMeddelanden] = useState([]);
  const [meddelandeData, setMeddelandeData] = useState({
    message: "",
    read_status: "Unread",
    homework_id: "",
    recipient_user_id: "",
  });
  const [editingMeddelandeId, setEditingMeddelandeId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [homeworks, setHomeworks] = useState([]);
  const [studentHomeworks, setStudentHomeworks] = useState([]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Fetch all homeworks (for title mapping)
  useEffect(() => {
    const fetchHomeworks = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/homeworks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("All homeworks fetched:", res.data);
        setHomeworks(res.data || []);
      } catch (error) {
        console.error("Error fetching homeworks:", error);
        setHomeworks([]);
      }
    };
    fetchHomeworks();
  }, []);

  // Enhanced debugging in the useEffect for student homeworks - FIXED
  useEffect(() => {
    if (!meddelandeData.recipient_user_id) {
      console.log("No recipient user ID, clearing student homeworks");
      setStudentHomeworks([]);
      return;
    }
    
    const token = localStorage.getItem("token");
    
    // Find the student object to get the correct student_id
    const selectedStudent = studentsInClass.find(s => s.user_id === Number(meddelandeData.recipient_user_id));
    
    console.log("=== STUDENT HOMEWORK LOOKUP DEBUG ===");
    console.log("recipient_user_id:", meddelandeData.recipient_user_id);
    console.log("studentsInClass:", studentsInClass);
    console.log("studentsInClass length:", studentsInClass.length);
    console.log("selectedStudent:", selectedStudent);
    console.log("editingMeddelandeId:", editingMeddelandeId);
    
    if (!selectedStudent) {
      console.log("❌ Could not find student with user_id:", meddelandeData.recipient_user_id);
      
      // If editing and studentsInClass is empty, don't fetch homeworks yet
      if (editingMeddelandeId && studentsInClass.length === 0) {
        console.log("🔄 Editing mode detected, studentsInClass is empty. Waiting for class data to load...");
        // Don't clear studentHomeworks, just wait
        return;
      }
      
      // If editing but we have students loaded and still can't find the student,
      // try to fetch directly by user_id
      if (editingMeddelandeId && studentsInClass.length > 0) {
        console.log("🔍 Edit mode: Student not found in current class, trying direct lookup...");
        
        // Try to get student info directly
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/${meddelandeData.recipient_user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((userResponse) => {
          if (userResponse.data && userResponse.data.student) {
            const studentId = userResponse.data.student.id;
            console.log("Found student ID via direct lookup:", studentId);
            
            // Fetch homeworks for this student
            return axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/student_homeworks/?student_id=${studentId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
          throw new Error("No student data found");
        })
        .then((res) => {
          console.log("Direct homework lookup result:", res.data);
          setStudentHomeworks(res.data || []);
        })
        .catch((error) => {
          console.error("❌ Error in direct student/homework lookup:", error);
          setStudentHomeworks([]);
        });
        
        return;
      }
      
      setStudentHomeworks([]);
      return;
    }
    
    const studentId = selectedStudent.id; // This is the student table ID, not user_id
    console.log("Using student_id for API call:", studentId);
    
    if (isNaN(studentId)) {
      console.log("Invalid student ID:", studentId);
      setStudentHomeworks([]);
      return;
    }

    console.log("=== FETCHING STUDENT HOMEWORKS ===");
    console.log("Student ID for API:", studentId);
    console.log("API URL:", `${process.env.REACT_APP_BACKEND_URL}/student_homeworks/?student_id=${studentId}`);
    
    axios
      .get(
        `${process.env.REACT_APP_BACKEND_URL}/student_homeworks/?student_id=${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        console.log("=== STUDENT HOMEWORKS API RESPONSE ===");
        console.log("Raw response:", res.data);
        console.log("Response type:", typeof res.data);
        console.log("Is array:", Array.isArray(res.data));
        console.log("Length:", res.data?.length || 0);
        
        // Enhanced debugging for each homework item
        if (Array.isArray(res.data)) {
          res.data.forEach((item, index) => {
            console.log(`=== HOMEWORK ITEM ${index} ===`);
            console.log("Full item:", item);
            console.log("Item keys:", Object.keys(item));
            
            if (item.homework) {
              console.log("Homework object:", item.homework);
              console.log("Homework keys:", Object.keys(item.homework));
              console.log("Title:", item.homework.title);
              console.log("ID:", item.homework.id);
              console.log("Due date:", item.homework.due_date);
              console.log("Status:", item.homework.status);
            } else {
              console.log("❌ NO 'homework' property found!");
              console.log("Available properties:", Object.keys(item));
            }
          });
        }
        
        setStudentHomeworks(res.data || []);
      })
      .catch((error) => {
        console.error("❌ Error fetching student homeworks:", error.response?.data || error);
        setStudentHomeworks([]);
      });
  }, [meddelandeData.recipient_user_id, studentsInClass, editingMeddelandeId]); // Added editingMeddelandeId as dependency

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/class_levels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassList(res.data || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setErrorMessage("Kunde inte hämta klasser.");
      }
    };
    fetchClasses();
  }, []);

  // Fetch students in selected class
  useEffect(() => {
    if (!selectedClassId) {
      setStudentsInClass([]);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/students/class_level/${selectedClassId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStudentsInClass(res.data || []))
      .catch((error) => {
        console.error("Error fetching students:", error);
        setStudentsInClass([]);
      });
  }, [selectedClassId]);

  // Fetch all messages
  useEffect(() => {
    const fetchMeddelanden = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/meddelanden/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeddelanden(response.data || []);
      } catch (error) {
        console.error("Error fetching meddelanden:", error.response?.data || error.message);
        setErrorMessage("Kunde inte hämta meddelanden.");
      }
    };
    fetchMeddelanden();
  }, []);

  // Build payload safely
  const buildPayload = (data, recipientId) => {
    const payload = {
      message: data.message.trim(),
      recipient_user_id: recipientId ? Number(recipientId) : Number(data.recipient_user_id),
    };
    if (data.homework_id && !isNaN(Number(data.homework_id))) {
      payload.homework_id = Number(data.homework_id);
    }
    return payload;
  };

  // Handle form submission - IMPROVED ERROR HANDLING
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!meddelandeData.message.trim()) {
      setErrorMessage("Meddelande krävs.");
      return;
    }

    if (!sendToAll && !meddelandeData.recipient_user_id) {
      setErrorMessage("Välj en elev eller markera 'Skicka till alla'.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let response;
      
      if (editingMeddelandeId) {
        // UPDATE existing message
        const payload = buildPayload(meddelandeData);
        console.log("=== UPDATE PAYLOAD ===");
        console.log("Payload:", payload);
        console.log("Edit ID:", editingMeddelandeId);
        console.log("URL:", `${process.env.REACT_APP_BACKEND_URL}/meddelanden/${editingMeddelandeId}/`);
        
        response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/meddelanden/${editingMeddelandeId}/`,
          payload,
          { 
            headers: { 
              "Content-Type": "application/json", 
              Authorization: `Bearer ${token}` 
            },
            timeout: 10000 // Add timeout
          }
        );
        setMeddelanden((prev) =>
          prev.map((m) => (m.id === editingMeddelandeId ? response.data : m))
        );
        setSuccessMessage("Meddelandet uppdaterades framgångsrikt!");
      } else {
        // CREATE new message(s)
        if (sendToAll && selectedClassId) {
          if (studentsInClass.length === 0) {
            setErrorMessage("Inga elever hittades i vald klass.");
            setLoading(false);
            return;
          }

          const results = await Promise.all(
            studentsInClass.map((student) => {
              const payload = buildPayload(meddelandeData, student.user.id);
              return axios.post(`${process.env.REACT_APP_BACKEND_URL}/meddelanden/`, payload, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              });
            })
          );
          setMeddelanden((prev) => [...prev, ...results.map((r) => r.data)]);
          setSuccessMessage(`Meddelanden skickades till ${results.length} elever!`);
        } else {
          const payload = buildPayload(meddelandeData);
          response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/meddelanden/`, payload, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          setMeddelanden((prev) => [...prev, response.data]);
          setSuccessMessage("Meddelandet skickades framgångsrikt!");
        }
      }

      // Reset form
      setMeddelandeData({
        message: "",
        read_status: "Unread",
        homework_id: "",
        recipient_user_id: "",
      });
      setEditingMeddelandeId(null);
      setSendToAll(false);
      setSelectedClassId("");
      setStudentsInClass([]);
      setStudentHomeworks([]);
    } catch (error) {
      console.error("=== ERROR DETAILS ===");
      console.error("Full error:", error);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Response:", error.response);
      console.error("Request:", error.request);
      
      let errorMsg = "Kunde inte spara meddelandet.";
      
      if (error.code === 'ERR_NETWORK') {
        errorMsg = "Nätverksfel - kontrollera att backend-servern körs och CORS är konfigurerat.";
      } else if (error.response?.status === 500) {
        errorMsg = "Serverfel (500) - kontrollera backend-loggar för mer information.";
      } else if (error.response?.data?.detail) {
        const backendDetail = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
          : error.response.data.detail;
        errorMsg = backendDetail;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle DELETE
  const handleDelete = async (meddelandeId) => {
    if (!window.confirm("Är du säker på att du vill radera detta meddelande?")) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/meddelanden/${meddelandeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeddelanden((prev) => prev.filter((m) => m.id !== meddelandeId));
      setSuccessMessage("Meddelandet raderades framgångsrikt.");
    } catch (error) {
      console.error("Error deleting message:", error);
      setErrorMessage("Kunde inte radera meddelandet.");
    }
  };

  // Handle EDIT - FIXED to properly populate class and students
  const handleEdit = async (m) => {
    setMeddelandeData({
      message: m.message || "",
      read_status: m.read_status || "Unread",
      homework_id: m.homework_id || "",
      recipient_user_id: m.recipient_user_id || "",
    });
    setEditingMeddelandeId(m.id);
    
    // Don't clear these when editing - we need to find and set the correct class
    // setSelectedClassId("");
    // setStudentsInClass([]);
    setSendToAll(false);
    
    // Find the recipient's class and populate students
    if (m.recipient_user_id) {
      const token = localStorage.getItem("token");
      try {
        // First, get the user to find their class
        const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/${m.recipient_user_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (userResponse.data && userResponse.data.student) {
          const classLevelId = userResponse.data.student.class_level_id;
          console.log("Found user's class_level_id:", classLevelId);
          
          // Set the class
          setSelectedClassId(classLevelId);
          
          // Fetch students in that class
          const studentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/students/class_level/${classLevelId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log("Students in class for edit:", studentsResponse.data);
          setStudentsInClass(studentsResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching user/class info for edit:", error);
        // Fallback: clear and let user re-select
        setSelectedClassId("");
        setStudentsInClass([]);
      }
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeddelandeData((prev) => ({ ...prev, [name]: value }));
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingMeddelandeId(null);
    setMeddelandeData({
      message: "",
      read_status: "Unread",
      homework_id: "",
      recipient_user_id: "",
    });
    setSelectedClassId("");
    setStudentsInClass([]);
    setSendToAll(false);
    setStudentHomeworks([]);
  };

  // Get homework title
  const homeworkTitle = (id) => {
    const hw = homeworks.find((h) => h.id === id);
    return hw ? hw.title : id ? `ID: ${id}` : "Ingen";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Hantera Meddelanden
        </h1>
        <p className="text-gray-500 mt-1">Skicka, uppdatera och hantera klass- och elevspecifika meddelanden.</p>
      </div>

      {/* Feedback alerts */}
      <div className="space-y-3 mb-6">
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
        <Alert type="error" message={errorMessage} onClose={() => setErrorMessage("")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-100 p-6 lg:sticky lg:top-6 h-fit">
          <SectionTitle
            title={editingMeddelandeId ? "Redigera meddelande" : "Nytt meddelande"}
            subtitle={editingMeddelandeId ? "Uppdatera befintligt meddelande" : "Skapa och skicka nytt meddelande"}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Class selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klass <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setMeddelandeData((d) => ({ ...d, recipient_user_id: "", homework_id: "" }));
                }}
                disabled={editingMeddelandeId}
              >
                <option value="">Välj klass</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Send to all checkbox */}
            {!editingMeddelandeId && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={sendToAll}
                  onChange={(e) => {
                    setSendToAll(e.target.checked);
                    if (e.target.checked) {
                      setMeddelandeData((d) => ({ ...d, recipient_user_id: "", homework_id: "" }));
                    }
                  }}
                  disabled={!selectedClassId}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sendToAll" className="text-sm text-gray-700">
                  Skicka till alla elever i klassen
                </label>
              </div>
            )}

            {/* Student selection - FIXED to use correct ID mapping */}
            {!sendToAll && selectedClassId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elev <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={meddelandeData.recipient_user_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    console.log("=== STUDENT SELECTION DEBUG ===");
                    console.log("Selected value:", val);
                    
                    // Find the selected student to get their student_id
                    const selectedStudent = studentsInClass.find(s => s.user_id.toString() === val);
                    console.log("Selected student object:", selectedStudent);
                    console.log("Student ID (for homework lookup):", selectedStudent?.id);
                    console.log("User ID (for message recipient):", selectedStudent?.user_id);
                    
                    setMeddelandeData((d) => ({
                      ...d,
                      recipient_user_id: val === "" ? "" : Number(val),
                      homework_id: "",
                    }));
                  }}
                >
                  <option value="">Välj elev</option>
                  {studentsInClass.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.user.first_name} {s.user.last_name} (Student ID: {s.id}, User ID: {s.user_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student selection for edit mode */}
            {editingMeddelandeId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Elev
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={meddelandeData.recipient_user_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMeddelandeData((d) => ({
                      ...d,
                      recipient_user_id: val === "" ? "" : Number(val),
                      homework_id: "",
                    }));
                  }}
                >
                  <option value="">Välj elev</option>
                  {studentsInClass.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.user.first_name} {s.user.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message content */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Meddelande <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={meddelandeData.message}
                onChange={handleChange}
                placeholder="Skriv ditt meddelande här…"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <div className="mt-2 flex justify-between items-center">
                <div>
                  <Badge tone="purple">Tips</Badge>{" "}
                  <span className="text-xs text-gray-500">
                    Håll tonen vänlig och tydlig. Lägg gärna till deadline eller länk.
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {meddelandeData.message.length}/500
                </span>
              </div>
            </div>

            {/* Read status (for editing) */}
            {editingMeddelandeId && (
              <div>
                <label htmlFor="read_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Lässtatus
                </label>
                <select
                  id="read_status"
                  name="read_status"
                  value={meddelandeData.read_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Unread">Oläst</option>
                  <option value="Read">Läst</option>
                </select>
              </div>
            )}

            {/* Homework selection - FIXED */}
            <div>
              <label htmlFor="homework_id" className="block text-sm font-medium text-gray-700 mb-1">
                Koppla till läxa (valfritt)
              </label>
              <select
                id="homework_id"
                name="homework_id"
                value={meddelandeData.homework_id}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {!meddelandeData.recipient_user_id && !sendToAll
                    ? "Välj först en elev eller 'Skicka till alla'"
                    : studentHomeworks.length === 0 && !sendToAll
                    ? "Inga läxor tilldelade till denna elev"
                    : "Välj läxa"
                  }
                </option>
                
                {sendToAll ? (
                  // Show all homeworks when sending to all students
                  homeworks.map((hw) => {
                    console.log("Rendering all homework:", hw);
                    return (
                      <option key={hw.id} value={hw.id}>
                        {hw.title} {hw.due_date ? `(Deadline: ${hw.due_date})` : ""}
                      </option>
                    );
                  })
                ) : (
                  // Show student-specific homeworks - FIXED
                  meddelandeData.recipient_user_id && Array.isArray(studentHomeworks) &&
                  studentHomeworks.map((studentHw, index) => {
                    console.log(`=== RENDERING HOMEWORK OPTION ${index} ===`);
                    console.log("Full studentHw object:", studentHw);
                    
                    // Check if studentHw exists
                    if (!studentHw) {
                      console.log(`❌ Homework ${index} is null/undefined`);
                      return null;
                    }
                    
                    // Check if homework property exists
                    if (!studentHw.homework) {
                      console.log(`❌ Homework ${index} has no 'homework' property`);
                      console.log("Available keys:", Object.keys(studentHw));
                      return null;
                    }
                    
                    const homework = studentHw.homework;
                    console.log(`Homework ${index} object:`, homework);
                    
                    // Check homework properties
                    if (!homework.id) {
                      console.log(`❌ Homework ${index} has no ID`);
                      return null;
                    }
                    
                    if (!homework.title) {
                      console.log(`❌ Homework ${index} has no title`);
                      return null;
                    }
                    
                    console.log(`✅ Rendering homework option: ID=${homework.id}, Title=${homework.title}`);
                    
                    return (
                      <option key={homework.id} value={homework.id}>
                        {homework.title} {homework.due_date ? `(Deadline: ${homework.due_date})` : ""} 
                        {homework.status === "completed" ? " ✓" : ""}
                      </option>
                    );
                  })
                )}
              </select>
              
              {/* Enhanced debug info - UPDATED */}
              {meddelandeData.recipient_user_id && !sendToAll && (
                <div className="text-xs text-gray-500 mt-1">
                  <p>Visar {studentHomeworks.length} läxor för vald elev</p>
                  <div className="text-red-500 space-y-1 mt-2">
                    <p>Debug: User ID (recipient) = {meddelandeData.recipient_user_id}</p>
                    <p>Debug: Student ID (for homework lookup) = {
                      studentsInClass.find(s => s.user_id === Number(meddelandeData.recipient_user_id))?.id || 'Not found'
                    }</p>
                    <p>Debug: studentsInClass length = {studentsInClass.length}</p>
                    <p>Debug: editingMeddelandeId = {editingMeddelandeId || 'null'}</p>
                    <p>Debug: selectedClassId = {selectedClassId || 'null'}</p>
                    <p>Debug: Homeworks count = {studentHomeworks.length}</p>
                    <p>Debug: studentHomeworks type = {typeof studentHomeworks}</p>
                    <p>Debug: Is array = {Array.isArray(studentHomeworks).toString()}</p>
                    {studentsInClass.length === 0 && editingMeddelandeId && (
                      <p className="text-orange-600">⚠️ Edit mode: Please re-select class to load students</p>
                    )}
                    {studentHomeworks.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600">Show raw data</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(studentHomeworks, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-[.99] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingMeddelandeId ? "Uppdaterar..." : "Skickar..."}
                  </span>
                ) : (
                  editingMeddelandeId ? "Uppdatera meddelande" : "Skicka meddelande"
                )}
              </button>
              
              {editingMeddelandeId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2.5 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:bg-gray-400 transition"
                >
                  Avbryt
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: Messages List */}
        <div className="space-y-4">
          <SectionTitle
            title="Befintliga meddelanden"
            subtitle={`${meddelanden.length} meddelanden totalt`}
          />

          {meddelanden.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md ring-1 ring-gray-100 p-6 text-gray-500 text-sm text-center">
              <div className="text-gray-400 text-4xl mb-3">📭</div>
              Inga meddelanden att visa ännu.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {meddelanden.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={m.homework_id ? "blue" : "gray"}>
                        {m.homework_id ? "Läx-kopplat" : "Allmänt"}
                      </Badge>
                      <Badge tone={m.read_status === "Read" ? "green" : "amber"}>
                        {m.read_status === "Read" ? "Läst" : "Oläst"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleDateString("sv-SE")}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-800 leading-relaxed mb-3 line-clamp-3">
                    {m.message}
                  </p>
                  
                  {m.homework_id && (
                    <p className="text-xs text-gray-500 mb-3">
                      Läxa: <span className="font-medium">{homeworkTitle(m.homework_id)}</span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="px-3 py-1.5 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 text-sm font-medium transition"
                    >
                      Redigera
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="px-3 py-1.5 rounded-md text-red-700 bg-red-50 hover:bg-red-100 text-sm font-medium transition"
                    >
                      Radera
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMeddelanden;