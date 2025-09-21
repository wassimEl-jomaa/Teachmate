import React from "react";
import { useNavigate } from "react-router-dom";

import { FaPlus, FaListUl, FaCheckCircle, FaCommentDots, FaUserGraduate } from "react-icons/fa";

const ManageHomework = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-12 text-center tracking-tight leading-snug">
        📝 Homework Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Single Student Homework Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-100 hover:shadow-blue-200 transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            📘 Student-Specific Homework
          </h2>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/add-homework")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaPlus /> Add Homework
            </button>
            <button
              onClick={() => navigate("/homeworks")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaListUl /> View / Update / Delete Homework
            </button>
          </div>
        </div>

        {/* Class Level Homework Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-100 hover:shadow-blue-200 transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            🏫 Class-Level Homework
          </h2>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/add-class-homework")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaPlus /> Add Homework
            </button>
            <button
              onClick={() => navigate("/class-homeworks")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaListUl /> View / Update / Delete Homework
            </button>
          </div>
        </div>

        {/* Teacher Homework Review & Feedback Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-green-100 hover:shadow-green-200 transition-shadow duration-300">
          <h2 className="text-2xl font-bold text-green-700 mb-6">
            👩‍🏫 Teacher Review & Feedback
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Review submitted homework, provide feedback, and grade student work
          </p>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/homework-review")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaCheckCircle /> Review & Grade Homework
            </button>
            
            <button
              onClick={() => navigate("/homework-feedback")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaCommentDots /> Provide Feedback
            </button>

            <button
              onClick={() => navigate("/student-progress")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              <FaUserGraduate /> Student Progress Overview
            </button>
          </div>
        </div>

        {/* Homework Analytics Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-purple-100 hover:shadow-purple-200 transition-shadow duration-300 md:col-span-2 xl:col-span-1">
          <h2 className="text-2xl font-bold text-purple-700 mb-6">
            📊 Homework Analytics
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Track completion rates, performance metrics, and class statistics
          </p>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/homework-analytics")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              📈 View Analytics Dashboard
            </button>
            
            <button
              onClick={() => navigate("/homework-reports")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              📄 Generate Reports
            </button>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-orange-100 hover:shadow-orange-200 transition-shadow duration-300 md:col-span-2 xl:col-span-1">
          <h2 className="text-2xl font-bold text-orange-700 mb-6">
            ⚡ Quick Actions
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Fast access to commonly used homework management features
          </p>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/pending-submissions")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              ⏰ Pending Submissions
            </button>
            
            <button
              onClick={() => navigate("/overdue-homework")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              🚨 Overdue Homework
            </button>

            <button
              onClick={() => navigate("/homework-templates")}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-600 transition duration-300 shadow-md hover:shadow-lg"
            >
              📋 Homework Templates
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Quick Stats Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          📋 Today's Homework Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-sm text-gray-600">Pending Reviews</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600">8</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600">85%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageHomework;