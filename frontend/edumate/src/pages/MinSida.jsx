import React, { useEffect, useState } from "react";
import axios from "axios";
import decodeToken from "../utils/utils"; // adjust path if needed

const MinSida = () => {
  const [student, setStudent] = useState(null);
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("No token found. Please log in again.");
          setLoading(false);
          return;
        }

        const message = decodeToken(token).split("|");
        const userId = parseInt(message[0], 10);

        // fetch student profile
        const studentRes = await axios.get(
          `http://127.0.0.1:8000/students/by_user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudent(studentRes.data);

        // fetch this student’s homeworks
        const hwRes = await axios.get(
          `http://127.0.0.1:8000/student_homeworks?student_id=${studentRes.data.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHomeworks(hwRes.data);
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || String(err);
        console.error("Could not load MinSida:", msg);
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 mark homework as completed
  const handleMarkAsComplete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.patch(
        `http://127.0.0.1:8000/student_homeworks/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update state immediately
      setHomeworks((prev) =>
        prev.map((hw) =>
          hw.id === id ? { ...hw, is_completed: true } : hw
        )
      );
    } catch (err) {
      console.error("Error marking homework complete:", err.response?.data || err);
      setErrorMessage("Kunde inte markera som klar.");
    }
  };

  if (loading) {
    return <p className="text-center mt-6 text-gray-600">Loading...</p>;
  }

  if (errorMessage) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-center text-red-600 font-medium text-lg bg-red-50 px-6 py-3 rounded-md shadow-md">
          ⚠️ Error: {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-6 text-center">
        Min Sida
      </h1>

      {student && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-lg mb-10 text-center">
          <h2 className="text-2xl font-bold">
            Välkommen, {student.user.first_name} {student.user.last_name} 👋
          </h2>
          <p className="mt-2 text-blue-100">Här ser du dina tilldelade läxor.</p>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-6 text-gray-700">
        📚 Mina Läxor
      </h2>

      {homeworks.length === 0 ? (
        <p className="text-gray-500 italic">Inga läxor tilldelade.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((shw) => (
            <div
              key={shw.id}
              className="border border-gray-200 p-6 rounded-xl shadow-md bg-white hover:shadow-lg hover:scale-[1.01] transition transform duration-200"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {shw.homework.title}
              </h3>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Beskrivning:</span>{" "}
                {shw.homework.description}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Förfallodatum:</span>{" "}
                {shw.homework.due_date}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">Prioritet:</span>{" "}
                {shw.homework.priority}
              </p>

              <p className="mt-2 mb-3">
                <span className="font-semibold">Status:</span>{" "}
                {shw.is_completed ? (
                  <span className="text-green-600 font-bold">✅ Klar</span>
                ) : (
                  <span className="text-red-600 font-bold">❌ Ej klar</span>
                )}
              </p>

              {!shw.is_completed && (
                <button
                  onClick={() => handleMarkAsComplete(shw.id)}
                  className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition"
                >
                  Markera som Klar ✅
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinSida;

