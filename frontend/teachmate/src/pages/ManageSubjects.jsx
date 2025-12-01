import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]); // State for the list of subjects
  const [subjectData, setSubjectData] = useState({
    name: "",
    description: "",
  }); // State for subject data
  const [editingSubjectId, setEditingSubjectId] = useState(null); // State for editing subject ID
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message

  // Fetch subjects from the backend
  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      try {
        const response = await axios.get("http://localhost:8000/subjects/", {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        setSubjects(response.data);
      } catch (error) {
        console.error(
          "Error fetching subjects:",
          error.response?.data || error.message
        );
        setErrorMessage("Failed to fetch subjects. Please try again.");
      }
    };

    fetchSubjects();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectData.name || !subjectData.description) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage

      if (editingSubjectId) {
        // Update subject
        const response = await axios.put(
          `http://localhost:8000/subjects/${editingSubjectId}/`,
          subjectData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setSubjects((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.id === editingSubjectId ? response.data : subject
          )
        );
        setSuccessMessage("Subject updated successfully!");
      } else {
        // Add new subject
        const response = await axios.post(
          "http://localhost:8000/subjects/",
          subjectData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setSubjects((prevSubjects) => [...prevSubjects, response.data]);
        setSuccessMessage("Subject added successfully!");
      }

      setErrorMessage("");
      setSubjectData({ name: "", description: "" });
      setEditingSubjectId(null);
    } catch (error) {
      console.error(
        "Error managing subject:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to manage subject. Please try again.");
      setSuccessMessage("");
    }
  };

  // Delete a subject
  const handleDelete = async (subjectId) => {
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    try {
      await axios.delete(`http://localhost:8000/subjects/${subjectId}/`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      setSubjects((prevSubjects) =>
        prevSubjects.filter((subject) => subject.id !== subjectId)
      );
      setSuccessMessage("Subject deleted successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Error deleting subject:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to delete subject. Please try again.");
      setSuccessMessage("");
    }
  };

  // Start editing a subject
  const handleEdit = (subject) => {
    setSubjectData({
      name: subject.name,
      description: subject.description,
    });
    setEditingSubjectId(subject.id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSubjectData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Manage Subjects</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-semibold">
            Subject Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={subjectData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter subject name"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-gray-700 font-semibold"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={subjectData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter subject description"
          />
        </div>
        {errorMessage && (
          <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="text-green-500 text-sm mb-4">{successMessage}</p>
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-all"
        >
          {editingSubjectId ? "Update Subject" : "Add Subject"}
        </button>
      </form>

      <h2 className="text-xl font-bold mt-8 mb-4">Existing Subjects</h2>
      <ul className="space-y-4">
        {subjects.map((subject) => (
          <li
            key={subject.id}
            className="flex justify-between items-center bg-gray-100 p-4 rounded-md"
          >
            <span>
              {subject.name}: {subject.description}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(subject)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(subject.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageSubjects;
