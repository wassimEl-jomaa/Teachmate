import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageClassLevel = () => {
  const [classLevels, setClassLevels] = useState([]); // State for the list of class levels
  const [classLevelData, setClassLevelData] = useState({
    name: "",
    school_id: "",
  }); // State for class level data
  const [schools, setSchools] = useState([]); // State for the list of schools
  const [editingClassLevelId, setEditingClassLevelId] = useState(null); // State for editing class level ID
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message

  // Fetch class levels from the backend
  useEffect(() => {
    const fetchClassLevels = async () => {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      try {
        const response = await axios.get(`http://${process.env.BASE_URL}:8000/class_levels`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        setClassLevels(response.data);
      } catch (error) {
        console.error(
          "Error fetching class levels:",
          error.response?.data || error.message
        );
        setErrorMessage("Failed to fetch class levels. Please try again.");
      }
    };

    fetchClassLevels();
  }, []);

  // Fetch schools from the backend
  useEffect(() => {
    const fetchSchools = async () => {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      try {
        const response = await axios.get(`http://${process.env.BASE_URL}:8000/schools`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        setSchools(response.data);
      } catch (error) {
        console.error(
          "Error fetching schools:",
          error.response?.data || error.message
        );
        setErrorMessage("Failed to fetch schools. Please try again.");
      }
    };

    fetchSchools();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classLevelData.name || !classLevelData.school_id) {
      setErrorMessage("Name and school are required.");
      return;
    }

    const token = localStorage.getItem("token"); // Retrieve the token from localStorage

    try {
      if (editingClassLevelId) {
        // Update class level
        const response = await axios.put(
          // Use PUT instead of PATCH
          `http://${process.env.BASE_URL}:8000/class_levels/${editingClassLevelId}`,
          classLevelData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setClassLevels((prevClassLevels) =>
          prevClassLevels.map((classLevel) =>
            classLevel.id === editingClassLevelId ? response.data : classLevel
          )
        );
        setSuccessMessage(
          `Class Level "${response.data.name}" updated successfully!`
        );
      } else {
        // Add class level
        const response = await axios.post(
          `http://${process.env.BASE_URL}:8000/class_levels/`,
          classLevelData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setClassLevels((prevClassLevels) => [
          ...prevClassLevels,
          response.data,
        ]);
        setSuccessMessage(
          `Class Level "${response.data.name}" added successfully!`
        );
      }

      setErrorMessage("");
      setClassLevelData({
        name: "",
        school_id: "",
      });
      setEditingClassLevelId(null);
    } catch (error) {
      console.error(
        "Error managing class level:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to manage class level. Please try again.");
      setSuccessMessage("");
    }
  };

  // Delete a class level
  const handleDelete = async (classLevelId) => {
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    try {
      await axios.delete(
        `http://${process.env.BASE_URL}:8000/class_levels/${classLevelId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        }
      );
      setClassLevels((prevClassLevels) =>
        prevClassLevels.filter((classLevel) => classLevel.id !== classLevelId)
      );
      setSuccessMessage("Class Level deleted successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Error deleting class level:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to delete class level. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClassLevelData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEdit = (classLevel) => {
    setEditingClassLevelId(classLevel.id);
    setClassLevelData({
      name: classLevel.name,
      school_id: classLevel.school_id || "",
    });
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Manage Class Levels</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-semibold">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={classLevelData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter class level name"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="school_id"
            className="block text-gray-700 font-semibold"
          >
            School
          </label>
          <select
            id="school_id"
            name="school_id"
            value={classLevelData.school_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a school</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
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
          {editingClassLevelId ? "Update Class Level" : "Add Class Level"}
        </button>
      </form>

      <h2 className="text-xl font-bold mt-8 mb-4">Existing Class Levels</h2>
      <ul className="space-y-4">
        {classLevels.map((classLevel) => (
          <li
            key={classLevel.id}
            className="flex justify-between items-center bg-gray-100 p-4 rounded-md"
          >
            <span>
              {classLevel.name} - School ID: {classLevel.school_id || "N/A"}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(classLevel)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(classLevel.id)}
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

export default ManageClassLevel;
