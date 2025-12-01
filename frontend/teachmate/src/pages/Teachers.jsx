import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Teachers = ({ userId }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Fetching user data for userId:", userId);

    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://${process.env.BASE_URL}:8000/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Fetched user data:", response.data);
        setUser(response.data);
      } catch (error) {
        console.error(
          "Error fetching user data:",
          error.response?.data || error.message
        );
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8">
        Teacher Dashboard
      </h1>

      {/* Display the teacher's name */}
      <p className="text-lg text-gray-600 mb-8">
        Welcome,{" "}
        <span className="font-semibold text-gray-800">
          {user.first_name} {user.last_name}
        </span>
        !
      </p>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Manage Homework Card */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Manage Homework
          </h2>
          <p className="text-gray-600 mb-4">
            Create and assign homework to students
          </p>
          <button
            onClick={() => navigate("/manage-homework")}
            className="bg-blue-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Homework
          </button>
        </div>

        {/* Manage Betyg Card */}
        <div className="bg-green-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Manage Betyg
          </h2>
          <p className="text-gray-600 mb-4">
            Grade student submissions and track progress
          </p>
          <button
            onClick={() => navigate("/betyg")}
            className="bg-green-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Grade
          </button>
        </div>

        {/* Manage Meddelanden Card */}
        <div className="bg-yellow-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Manage Messages
          </h2>
          <p className="text-gray-600 mb-4">
            Send messages and announcements to students
          </p>
          <button
            onClick={() => navigate("/manage-meddelanden")}
            className="bg-yellow-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Add Messages
          </button>
        </div>

        {/* NEW: AI Score Assist Card */}
        <div className="bg-purple-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            🤖 AI Score Assist
          </h2>
          <p className="text-gray-600 mb-4">
            Get AI-powered scoring suggestions for student submissions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/ai-scoring")}
              className="bg-purple-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Try AI Scoring
            </button>
          </div>
          <div className="mt-3 text-sm text-purple-600">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            AI Model Active
          </div>
        </div>

        {/* View Submissions Card */}
        <div className="bg-indigo-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            View Submissions
          </h2>
          <p className="text-gray-600 mb-4">
            Review and grade student homework submissions
          </p>
          <button
            onClick={() => navigate("/view-submissions")}
            className="bg-indigo-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            View All
          </button>
        </div>

        {/* Analytics Card */}
        <div className="bg-red-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            📊 Analytics
          </h2>
          <p className="text-gray-600 mb-4">
            View class performance and grading statistics
          </p>
          <button
            onClick={() => navigate("/teacher-analytics")}
            className="bg-red-600 text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-700 mb-6">
          Quick Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">--</div>
            <div className="text-gray-600">Active Homework</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">--</div>
            <div className="text-gray-600">Pending Grades</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">--</div>
            <div className="text-gray-600">AI Scores Generated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">--</div>
            <div className="text-gray-600">Students</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teachers;