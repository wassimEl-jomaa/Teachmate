import React, { useEffect, useState } from "react";
import axios from "axios";

const Badge = ({ children, tone = "blue" }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${tone}-100 text-${tone}-800`}
  >
    {children}
  </span>
);

const MeddelandePage = ({ userId }) => {
  const [meddelanden, setMeddelanden] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Fetching meddelanden for userId:", userId);

    if (!userId) {
      setError("User ID saknas");
      setLoading(false);
      return;
    }

    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/meddelanden/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setMeddelanden(response.data || []);
        setLoading(false);
        console.log("Fetched messages:", response.data);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setError(err.response?.data?.detail || "Failed to fetch messages");
        setLoading(false);
      });
  }, [userId]);

  const handleStatusUpdate = (meddelandeId) => {
    const token = localStorage.getItem("token");
    
    axios
      .put(
        `${process.env.REACT_APP_BACKEND_URL}/meddelanden/${meddelandeId}/?mark_as_read=true`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        console.log("Meddelande marked as read:", response.data);
        // Update the status locally after a successful request
        setMeddelanden((prevMeddelanden) =>
          prevMeddelanden.map((meddelande) =>
            meddelande.id === meddelandeId
              ? { ...meddelande, read_status: "Read" }
              : meddelande
          )
        );
      })
      .catch((error) => {
        console.error("Failed to mark as read:", error);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mina Meddelanden</h1>
        <p className="text-gray-600">Meddelanden från dina lärare och skolpersonal</p>
      </div>

      {/* Messages */}
      {meddelanden.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Inga meddelanden</h3>
          <p className="text-gray-500">Du har inga meddelanden att visa just nu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meddelanden.map((meddelande) => (
            <div
              key={meddelande.id}
              className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                meddelande.read_status === "Read" 
                  ? "border-gray-200 opacity-75" 
                  : "border-blue-200 shadow-blue-50"
              }`}
            >
              <div className="p-6">
                {/* Header with badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge tone={meddelande.read_status === "Read" ? "gray" : "blue"}>
                      {meddelande.read_status === "Read" ? "Läst" : "Nytt"}
                    </Badge>
                    {meddelande.homework_id && (
                      <Badge tone="purple">
                        Läx-relaterat
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(meddelande.created_at).toLocaleDateString("sv-SE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>

                {/* Message content */}
                <div className="mb-4">
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {meddelande.message}
                  </div>
                  {meddelande.description && (
                    <div className="mt-2 text-gray-600 text-sm">
                      {meddelande.description}
                    </div>
                  )}
                </div>

                {/* Homework info if applicable */}
                {meddelande.homework_id && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-600">📚</span>
                      <span className="text-purple-800 font-medium text-sm">
                        Detta meddelande är kopplat till en läxa
                      </span>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {meddelande.read_status !== "Read" && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleStatusUpdate(meddelande.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                    >
                      Markera som läst
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {meddelanden.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Totalt {meddelanden.length} meddelanden</span>
            <span>
              {meddelanden.filter(m => m.read_status !== "Read").length} olästa
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeddelandePage;