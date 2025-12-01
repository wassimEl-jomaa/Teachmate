import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageBetyg = () => {
  const [betygList, setBetygList] = useState([]);
  const [newBetyg, setNewBetyg] = useState({
    grade: "",
    comments: "",
    feedback: "",
    homework_id: "",
  });
  const [error, setError] = useState("");

  // Fetch all Betyg
  const fetchBetyg = async () => {
    try {
      const response = await axios.get(`http://${process.env.BASE_URL}:8000/betyg/`);
      setBetygList(response.data);
    } catch (err) {
      setError("Failed to fetch betyg.");
    }
  };

  // Add a new Betyg
  const addBetyg = async () => {
    if (!newBetyg.grade || !newBetyg.homework_id) {
      setError("Grade and Homework ID are required.");
      return;
    }

    try {
      const response = await axios.post(
        `http://${process.env.BASE_URL}:8000/betyg/`,
        newBetyg
      );
      setBetygList([...betygList, response.data]);
      setNewBetyg({ grade: "", comments: "", feedback: "", homework_id: "" });
      setError("");
    } catch (err) {
      setError("Failed to add betyg.");
    }
  };

  // Delete a Betyg
  const deleteBetyg = async (id) => {
    try {
      await axios.delete(`http://${process.env.BASE_URL}:8000/betyg/${id}`);
      setBetygList(betygList.filter((betyg) => betyg.id !== id));
    } catch (err) {
      setError("Failed to delete betyg.");
    }
  };

  useEffect(() => {
    fetchBetyg();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Betyg</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* Add Betyg Form */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Add New Betyg</h2>
        <input
          type="text"
          placeholder="Grade"
          value={newBetyg.grade}
          onChange={(e) => setNewBetyg({ ...newBetyg, grade: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Comments"
          value={newBetyg.comments}
          onChange={(e) =>
            setNewBetyg({ ...newBetyg, comments: e.target.value })
          }
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Feedback"
          value={newBetyg.feedback}
          onChange={(e) =>
            setNewBetyg({ ...newBetyg, feedback: e.target.value })
          }
          className="border p-2 mr-2"
        />
        <input
          type="number"
          placeholder="Homework ID"
          value={newBetyg.homework_id}
          onChange={(e) =>
            setNewBetyg({ ...newBetyg, homework_id: e.target.value })
          }
          className="border p-2 mr-2"
        />
        <button
          onClick={addBetyg}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* Betyg List */}
      <div>
        <h2 className="text-xl font-bold mb-2">Betyg List</h2>
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">ID</th>
              <th className="border border-gray-300 px-4 py-2">Grade</th>
              <th className="border border-gray-300 px-4 py-2">Comments</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {betygList.map((betyg) => (
              <tr key={betyg.id}>
                <td className="border border-gray-300 px-4 py-2">{betyg.id}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {betyg.grade}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {betyg.comments}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    onClick={() => deleteBetyg(betyg.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBetyg;
