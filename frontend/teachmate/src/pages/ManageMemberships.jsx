import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageMemberships = () => {
  const [memberships, setMemberships] = useState([]); // State for the list of memberships
  const [membershipData, setMembershipData] = useState({
    membership_type: "",
    start_date: "",
    end_date: "",
  }); // State for membership data
  const [editingMembershipId, setEditingMembershipId] = useState(null); // State for editing membership ID
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message

  // Fetch memberships from the backend
  useEffect(() => {
    const fetchMemberships = async () => {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/memberships/`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        setMemberships(response.data);
      } catch (error) {
        console.error(
          "Error fetching memberships:",
          error.response?.data || error.message
        );
        setErrorMessage("Failed to fetch memberships. Please try again.");
      }
    };

    fetchMemberships();
  }, []);

  // Add or update a membership
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !membershipData.membership_type ||
      !membershipData.start_date ||
      !membershipData.end_date
    ) {
      setErrorMessage("All fields are required.");
      return;
    }

    const token = localStorage.getItem("token"); // Retrieve the token from localStorage

    try {
      if (editingMembershipId) {
        // Update membership
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/memberships/${editingMembershipId}/`,
          membershipData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setMemberships((prevMemberships) =>
          prevMemberships.map((membership) =>
            membership.id === editingMembershipId ? response.data : membership
          )
        );
        setSuccessMessage("Membership updated successfully!");
      } else {
        // Add new membership
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/memberships/`,
          membershipData,
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include the token in the Authorization header
            },
          }
        );
        setMemberships((prevMemberships) => [
          ...prevMemberships,
          response.data,
        ]);
        setSuccessMessage("Membership added successfully!");
      }

      setErrorMessage("");
      setMembershipData({ membership_type: "", start_date: "", end_date: "" });
      setEditingMembershipId(null);
    } catch (error) {
      console.error(
        "Error managing membership:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to manage membership. Please try again.");
      setSuccessMessage("");
    }
  };

  // Delete a membership
  const handleDelete = async (membershipId) => {
    const token = localStorage.getItem("token"); // Retrieve the token from localStorage
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/memberships/${membershipId}/`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      setMemberships((prevMemberships) =>
        prevMemberships.filter((membership) => membership.id !== membershipId)
      );
      setSuccessMessage("Membership deleted successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Error deleting membership:",
        error.response?.data || error.message
      );
      setErrorMessage("Failed to delete membership. Please try again.");
      setSuccessMessage("");
    }
  };

  // Start editing a membership
  const handleEdit = (membership) => {
    setMembershipData({
      membership_type: membership.membership_type,
      start_date: membership.start_date,
      end_date: membership.end_date,
    });
    setEditingMembershipId(membership.id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMembershipData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Manage Memberships</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="membership_type"
            className="block text-gray-700 font-semibold"
          >
            Membership Type
          </label>
          <input
            type="text"
            id="membership_type"
            name="membership_type"
            value={membershipData.membership_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter membership type"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="start_date"
            className="block text-gray-700 font-semibold"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={membershipData.start_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="end_date"
            className="block text-gray-700 font-semibold"
          >
            End Date
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={membershipData.end_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {editingMembershipId ? "Update Membership" : "Add Membership"}
        </button>
      </form>

      <h2 className="text-xl font-bold mt-8 mb-4">Existing Memberships</h2>
      <ul className="space-y-4">
        {memberships.map((membership) => (
          <li
            key={membership.id}
            className="flex justify-between items-center bg-gray-100 p-4 rounded-md"
          >
            <span>
              {membership.membership_type} ({membership.start_date} -{" "}
              {membership.end_date})
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(membership)}
                className="text-blue-500 hover:text-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(membership.id)}
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

export default ManageMemberships;
