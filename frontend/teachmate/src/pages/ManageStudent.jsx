import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageStudents = () => {
  const [students, setStudents] = useState([]); // State for the list of students
  const [studentData, setStudentData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    arskurs_id: "",
  }); // State for student data
  const [editingStudentId, setEditingStudentId] = useState(null); // State for editing student ID
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const [arskurser, setArskurser] = useState([]); // State for the list of Arskurs

  // Fetch students from the backend
  useEffect(() => {
    const fetchStudents = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:8000/students/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStudents(response.data);
      } catch (error) {
        console.error(
          "Error fetching students:",
          error.response?.data || error.message
        );
      }
    };

    fetchStudents();
  }, []);

  // Fetch Arskurs options from the backend
  useEffect(() => {
    const fetchArskurser = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:8000/arskurs/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setArskurser(response.data);
      } catch (error) {
        console.error(
          "Error fetching Arskurser:",
          error.response?.data || error.message
        );
      }
    };

    fetchArskurser();
  }, []);

  // Add or update a student
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentData.username || !studentData.email) {
      setErrorMessage("Username and email are required.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      if (editingStudentId) {
        // Update student
        const response = await axios.patch(
          `http://localhost:8000/students/${editingStudentId}`,
          studentData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token
            },
          }
        );
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === editingStudentId ? response.data : student
          )
        );
        setSuccessMessage(
          `Student "${response.data.username}" updated successfully!`
        );
      } else {
        // Add student
        const response = await axios.post(
          "http://localhost:8000/students/",
          studentData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token
            },
          }
        );
        setStudents((prevStudents) => [...prevStudents, response.data]);
        setSuccessMessage(
          `Student "${response.data.username}" added successfully!`
        );
      }

      setErrorMessage("");
      setStudentData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone_number: "",
        arskurs_id: "",
      });
      setEditingStudentId(null);
    } catch (error) {
      console.error(
        "Error managing student:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to manage student. Please try again.");
      setSuccessMessage("");
    }
  };

  // Delete a student
  const handleDelete = async (studentId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/students/${studentId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents((prevStudents) =>
        prevStudents.filter((student) => student.id !== studentId)
      );
      setSuccessMessage("Student deleted successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Error deleting student:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to delete student. Please try again.");
      setSuccessMessage("");
    }
  };

  // Start editing a student
  const handleEdit = (student) => {
    setStudentData({
      username: student.username,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      password: "", // Leave password empty for security
      phone_number: student.phone_number,
      arskurs_id: student.arskurs_id || "",
    });
    setEditingStudentId(student.id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Manage Students</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-gray-700 font-semibold"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={studentData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-semibold">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={studentData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="arskurs_id"
            className="block text-gray-700 font-semibold"
          >
            Årskurs
          </label>
          <select
            id="arskurs_id"
            name="arskurs_id"
            value={studentData.arskurs_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Årskurs</option>
            {arskurser.map((arskurs) => (
              <option key={arskurs.id} value={arskurs.id}>
                {arskurs.name}
              </option>
            ))}
          </select>
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
          {editingStudentId ? "Update Student" : "Add Student"}
        </button>
      </form>

      <h2 className="text-xl font-bold mt-8 mb-4">Existing Students</h2>
      <ul className="space-y-4">
        {students.map((student) => (
          <li
            key={student.id}
            className="flex justify-between items-center bg-gray-100 p-4 rounded-md"
          >
            <span>
              {student.username} ({student.email})
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(student)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(student.id)}
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

export default ManageStudents;
