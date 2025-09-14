import React, { useState, useEffect } from "react";
import axios from "axios";
import SideBar from "../components/SideBar";

const MinSida = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [studentHomeworks, setStudentHomeworks] = useState([]);

  const API_BASE = "http://localhost:8000";

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/users/${userId}`, {
          headers: authHeaders(),
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error.response?.data || error.message);
      }
    };
    if (userId) fetchUserData();
  }, [userId]);

  useEffect(() => {
    const fetchStudentHomeworks = async () => {
      try {
        const response = await axios.get(`${API_BASE}/student_homeworks?student_id=${userId}`, {
          headers: authHeaders(),
        });
        setStudentHomeworks(response.data);
      } catch (error) {
        console.error("Error fetching student homeworks:", error.response?.data || error.message);
      }
    };
    if (userId) fetchStudentHomeworks();
  }, [userId]);

  const isCompleted = (sh) =>
    typeof sh?.homework?.status === "string" &&
    sh.homework.status.toLowerCase() === "completed";

  const toUiStatus = (sh) => (isCompleted(sh) ? "Klar" : "Ej klar");

  const handleCompleteHomework = async (studentHomeworkId) => {
    // Optimistic UI update
    setStudentHomeworks((prev) =>
      prev.map((sh) =>
        sh.id === studentHomeworkId
          ? { ...sh, homework: { ...(sh.homework ?? {}), status: "completed" } }
          : sh
      )
    );

    try {
      await axios.patch(
        `${API_BASE}/student_homeworks/${studentHomeworkId}`,
        { status: "completed" },
        { headers: authHeaders() }
      );
    } catch (err) {
      // Rollback if error
      setStudentHomeworks((prev) =>
        prev.map((sh) =>
          sh.id === studentHomeworkId
            ? { ...sh, homework: { ...(sh.homework ?? {}), status: "pending" } }
            : sh
        )
      );
      console.error("Error marking homework as complete:", err);
      alert("Kunde inte markera som klar.");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <SideBar />
        <div className="flex-1 p-6 bg-gray-100">
          <h1 className="text-4xl font-semibold text-center mb-8 blue shadow-lg rounded-lg p-6 bg-gradient-to-r from-blue-400 to-indigo-600 text-white">
            Laddar användardata...
          </h1>
        </div>
      </div>
    );
  }

  const ongoingHomeworks = studentHomeworks.filter((sh) => !isCompleted(sh));

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-4xl font-semibold text-center mb-8 blue shadow-lg rounded-lg p-6 bg-gradient-to-r from-blue-400 to-indigo-600 text-white">
          Välkommen,{" "}
          {user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : "Användare"}
          !
        </h1>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Pågående Läxor</h2>
          <div className="space-y-4">
            {studentHomeworks.length === 0 ? (
              <p>Inga läxor.</p>
            ) : (
              studentHomeworks.map((sh) => (
                <div key={sh.id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold">{sh.homework?.title || "Läxa"}</h3>
                  <p><strong>Beskrivning:</strong> {sh.homework?.description}</p>
                  <p><strong>Förfallodatum:</strong> {sh.homework?.due_date}</p>
                  <p><strong>Prioritet:</strong> {sh.homework?.priority}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={isCompleted(sh) ? "text-red-600 font-bold" : ""}>
                      {toUiStatus(sh)}
                    </span>
                  </p>
                  {isCompleted(sh) ? (
                    <button
                      disabled
                      className="bg-red-600 text-white px-4 py-2 rounded-md cursor-default mt-3"
                    >
                      Klar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCompleteHomework(sh.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all mt-3"
                    >
                      Markera som klar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinSida;

