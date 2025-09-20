import React, { useEffect, useState } from "react";
import axios from "axios";

const BetygForm = () => {
  const [betygs, setBetygs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://127.0.0.1:8000/betyg/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setBetygs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Kunde inte hämta betyg.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <span className="ml-4 text-purple-600 font-semibold">
          Laddar betyg...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-200 text-red-800 rounded-lg shadow-md text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-8 text-center">
        🌟 Mina Betyg
      </h2>

      {betygs.length === 0 ? (
        <div className="text-gray-500 italic text-center bg-gradient-to-r from-gray-100 to-gray-200 py-8 rounded-lg shadow-md">
          Inga betyg tillgängliga.
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {betygs.map((betyg, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 border hover:shadow-2xl transform transition duration-300 hover:-translate-y-2"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-800">
                  Betyg:
                </span>
                <span
                  className={`px-4 py-1 rounded-full text-white text-lg font-semibold shadow ${
                    betyg.grade === "A"
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : betyg.grade === "B"
                      ? "bg-gradient-to-r from-blue-400 to-blue-600"
                      : betyg.grade === "C"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                      : betyg.grade === "D"
                      ? "bg-gradient-to-r from-orange-400 to-orange-600"
                      : betyg.grade === "E"
                      ? "bg-gradient-to-r from-pink-400 to-pink-600"
                      : "bg-gradient-to-r from-gray-400 to-gray-600"
                  }`}
                >
                  {betyg.grade}
                </span>
              </div>

              <p className="text-gray-700 mb-2">
                <span className="font-semibold text-purple-600">💬 Beskrivning:</span>{" "}
                {betyg.description || "Ingen kommentar"}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold text-pink-600">✨ Feedback:</span>{" "}
                {betyg.feedback || "Ingen feedback"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BetygForm;
