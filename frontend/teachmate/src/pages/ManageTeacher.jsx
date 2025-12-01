import React, { useState, useEffect } from "react";
import axios from "axios";
import { TeacherCard } from "../components/TeacherCard";

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");

  const fetchTeachers = async () => {
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    const url = `${process.env.REACT_APP_BACKEND_URL}/teachers/`; // Backend endpoint for fetching teachers
    console.log("Fetching teachers from:", url);

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      console.log("Teachers fetched successfully:", response.data); // Debug log
      setTeachers(response.data); // Update the state with the fetched teachers
    } catch (err) {
      console.error(
        "Error fetching teachers:",
        err.response?.data || err.message
      );
      setError("Failed to fetch teachers. Please try again."); // Set error message
    }
  };

  // Call fetchTeachers when the component loads
  useEffect(() => {
    fetchTeachers();
  }, []);
  const handleEdit = (teacherId) => {
    console.log(`Edit teacher with ID: ${teacherId}`);
    // Add logic to navigate to the edit page or open a modal
  };

  const handleDelete = async (teacherId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/teachers/${teacherId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTeachers((prevTeachers) =>
        prevTeachers.filter((teacher) => teacher.id !== teacherId)
      );
    } catch (err) {
      console.error(
        "Error deleting teacher:",
        err.response?.data || err.message
      );
      setError("Failed to delete teacher. Please try again.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manage Teachers</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <TeacherCard
            key={teacher.id}
            teacher={teacher}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ManageTeachers;
