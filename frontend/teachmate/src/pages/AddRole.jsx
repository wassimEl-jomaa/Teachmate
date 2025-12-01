import React, { useEffect, useState } from "react";
import axios from "axios";

const AddRoles = () => {
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const API_URL = `http://${process.env.BASE_URL}:8000/roles`;
  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // 🔄 Fetch Roles
  const fetchRoles = async () => {
    try {
      const res = await axios.get(API_URL, { headers });
      setRoles(res.data);
    } catch (err) {
      setError("Failed to load roles");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // ➕ Add or ✏️ Edit Role
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setError("Role name cannot be empty");
      return;
    }

    try {
      if (editingId) {
        const res = await axios.put(
          `${API_URL}/${editingId}`,
          { name: roleName },
          { headers }
        );
        setRoles((prev) =>
          prev.map((role) => (role.id === editingId ? res.data : role))
        );
        setSuccess(`Updated role: ${res.data.name}`);
      } else {
        const res = await axios.post(API_URL, { name: roleName }, { headers });
        setRoles((prev) => [...prev, res.data]);
        setSuccess(`Added role: ${res.data.name}`);
      }

      setRoleName("");
      setEditingId(null);
      setError("");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Operation failed";
      setError(detail);
      setSuccess("");
    }
  };

  // 🗑️ Delete Role
  const handleDelete = async (id) => {
    if (!id) {
      setError("Invalid role ID. Cannot delete.");
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`, { headers });
      setRoles((prev) => prev.filter((role) => role.id !== id));
      setSuccess("Role deleted successfully");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Delete failed");
    }
  };

  // ✏️ Begin Edit
  const handleEdit = (role) => {
    setEditingId(role.id);
    setRoleName(role.name);
    setError("");
    setSuccess("");
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        🔐 Role Management
      </h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </form>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📋 Existing Roles
      </h2>
      <ul className="space-y-3">
        {roles.map((role) => (
          <li
            key={role.id}
            className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-md shadow-sm"
          >
            <span className="font-medium">{role.name}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(role)}
                className="text-blue-600 hover:underline font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  console.log("Trying to delete:", role);
                  handleDelete(role.id);
                }}
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

export default AddRoles;
