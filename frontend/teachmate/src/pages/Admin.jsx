import React from "react";
import { Link } from "react-router-dom";

const Admin = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-blue-100 p-4">
        <h2 className="text-2xl font-bold mb-6">Manage Panel</h2>
        <ul className="space-y-4">
          <li>
            <Link
              to="/manage-users"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              User
            </Link>
          </li>

          <li>
            <Link
              to="/manage-meddelanden"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              Messages
            </Link>
          </li>
          <li>
            <Link
              to="/manage-arskurs"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              class level
            </Link>
          </li>
          <li>
            <Link
              to="/add-role"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              Roles
            </Link>
          </li>

          <li>
            <Link
              to="/manage-teachers"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              Teacher
            </Link>
          </li>
          <li>
            <Link
              to="/manage-subjects"
              className="block text-lg text-blue-800 hover:text-blue-600"
            >
              Subject
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-3/4 p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to the Admin Page</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-200 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Total Users</h3>
            <p className="text-2xl">4</p>
          </div>
          <div className="bg-green-200 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Active Memberships</h3>
            <p className="text-2xl">4</p>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
