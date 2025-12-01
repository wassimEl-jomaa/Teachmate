import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageUsers = () => {
  const [users, setUsers] = useState([]); // State for the list of users
  const [userType, setUserType] = useState("Student"); // Default to Student
  const [arskurser, setArskurser] = useState([]); // State for the list of Arskurs
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    arskurs_id: "",
    role_id: 0,
    address: "", // Added address field
  }); // State for user data
  const [editingUserId, setEditingUserId] = useState(null); // State for editing user ID
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message

  // Fetch users from the backend
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:8000/users/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        console.error(
          "Error fetching users:",
          error.response?.data || error.message
        );
      }
    };

    fetchUsers();
  }, []);

  // Fetch Arskurs options from the backend
  useEffect(() => {
    const fetchArskurser = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:8000/class_levels", {
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

  // Handle form submission (Add or Update User)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData.username || !userData.email) {
      setErrorMessage("Username and email are required.");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      if (editingUserId) {
        // Update user
        const response = await axios.patch(
          `http://localhost:8000/users/${editingUserId}`,
          userData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === editingUserId ? response.data : user
          )
        );
        setSuccessMessage(
          `User "${response.data.username}" updated successfully!`
        );
      } else {
        // Add new user
        const response = await axios.post(
          "http://localhost:8000/users/",
          userData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers((prevUsers) => [...prevUsers, response.data]);
        setSuccessMessage(
          `User "${response.data.username}" added successfully!`
        );
      }

      // Reset the form
      setErrorMessage("");
      setUserData({
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone_number: "",
        arskurs_id: "",
        role_id: 0,
        address: "", // Reset the address field
      });
      setEditingUserId(null);
    } catch (error) {
      console.error(
        "Error managing user:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to manage user. Please try again.");
      setSuccessMessage("");
    }
  };

  // Handle deleting a user
  const handleDelete = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setSuccessMessage("User deleted successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Error deleting user:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to delete user. Please try again.");
      setSuccessMessage("");
    }
  };
  // Handle the user type selection change
  const handleUserTypeChange = (e) => {
    const selectedType = e.target.value;
    setUserType(selectedType);
    setUserData({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone_number: "",
      arskurs_id: "",
      role_id: 0,
      subject_id: null,
      qualifications: "",
    });
  };
  // Handle editing a user (pre-fill the form with user data)
  const handleEdit = (user) => {
    setUserData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: "", // Leave password empty for security
      phone_number: user.phone_number,
      arskurs_id: user.arskurs_id || 0,
      role_id: user.role_id || 0,
      address: user.address || "", // Pre-fill address field for editing
    });
    setEditingUserId(user.id);
  };

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-wide leading-tight">
        User Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {/* Student Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">Student</h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Add Student
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Students
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Students by class level
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Students by Name
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Update a Student
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Delete a Student
            </button>
          </div>
        </div>

        {/* Parents Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">Parents</h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Add Parent
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Parents
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Parents by class level
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Parents by Student Name
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Update a Parent
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Delete a Parent
            </button>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">
            Teachers
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Add Teacher
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Teachers
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Teachers by class level
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Teachers by Student Name
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Update a Teacher
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Delete a Teacher
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* User Type Selection */}
        <div className="mb-4">
          <label
            htmlFor="user_type"
            className="block text-gray-700 font-semibold"
          >
            User Type
          </label>
          <select
            id="user_type"
            name="user_type"
            value={userType}
            onChange={handleUserTypeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Parent">Parent</option>
          </select>
        </div>

        {/* Username */}
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
            value={userData.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
          />
        </div>

        {/* First Name */}
        <div className="mb-4">
          <label
            htmlFor="first_name"
            className="block text-gray-700 font-semibold"
          >
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={userData.first_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <label
            htmlFor="last_name"
            className="block text-gray-700 font-semibold"
          >
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={userData.last_name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-semibold">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 font-semibold"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label
            htmlFor="phone_number"
            className="block text-gray-700 font-semibold"
          >
            Phone Number
          </label>
          <input
            type="text"
            id="phone_number"
            name="phone_number"
            value={userData.phone_number}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label
            htmlFor="address"
            className="block text-gray-700 font-semibold"
          >
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={userData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Postal Code */}
        <div className="mb-4">
          <label
            htmlFor="postal_code"
            className="block text-gray-700 font-semibold"
          >
            Postal Code
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={userData.postal_code}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* City */}
        <div className="mb-4">
          <label htmlFor="city" className="block text-gray-700 font-semibold">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={userData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Country */}
        <div className="mb-4">
          <label
            htmlFor="country"
            className="block text-gray-700 font-semibold"
          >
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={userData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Arskurs Dropdown */}
        <div className="mb-4">
          <label
            htmlFor="arskurs_id"
            className="block text-gray-700 font-semibold"
          >
            Class Level
          </label>
          <select
            id="arskurs_id"
            name="arskurs_id"
            value={userData.arskurs_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Select class level</option>
            {arskurser.map((arskurs) => (
              <option key={arskurs.id} value={arskurs.id}>
                {arskurs.name}
              </option>
            ))}
          </select>
        </div>

        {/* Success and Error messages */}
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
          {editingUserId ? "Update User" : "Add User"}
        </button>
      </form>

      <h2 className="text-xl font-bold mt-8 mb-4">📋 Existing Users</h2>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full table-auto border border-gray-200 bg-white">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">First Name</th>
              <th className="px-4 py-2 border">Last Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Phone</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Address</th>{" "}
              {/* New Address column */}
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{user.username}</td>
                <td className="px-4 py-2 border">{user.first_name}</td>
                <td className="px-4 py-2 border">{user.last_name}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">{user.phone_number}</td>
                <td className="px-4 py-2 border">
                  {user.role?.name || user.role_id}
                </td>
                <td className="px-4 py-2 border">{user.address}</td>{" "}
                {/* Displaying Address */}
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:underline"
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

export default ManageUsers;
