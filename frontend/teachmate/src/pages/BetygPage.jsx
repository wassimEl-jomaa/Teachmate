import React, { useEffect, useState } from "react";
import axios from "axios";

const BetygPage = () => {
  const [betygList, setBetygList] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]); // State for homework
  const [error, setError] = useState("");

  // Fetch Betyg for the logged-in student
  const fetchBetyg = async () => {
    try {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      const response = await axios.get("http://localhost:8000/betyg/me", {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      console.log("Fetched Betyg:", response.data); // Debug log
      setBetygList(response.data);
    } catch (err) {
      console.error("Error fetching betyg:", err.response || err); // Debug log
      setError("Failed to fetch betyg.");
    }
  };

  useEffect(() => {
    fetchBetyg();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Grades</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* Betyg List */}
      <div>
        <h2 className="text-xl font-bold mb-2">Betyg List</h2>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Subject</th>
              <th className="border border-gray-300 px-4 py-2">
                Homework Title
              </th>
              <th className="border border-gray-300 px-4 py-2">Grade</th>
              <th className="border border-gray-300 px-4 py-2">Comments</th>
              <th className="border border-gray-300 px-4 py-2">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {betygList.length > 0 ? (
              betygList.map((betyg) => (
                <tr key={betyg.id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.id}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.subject}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.homework_title}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.grade}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.comments}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {betyg.feedback}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="border border-gray-300 px-4 py-2 text-center"
                >
                  No grades found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BetygPage;
