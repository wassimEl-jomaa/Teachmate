import React, { useState } from "react";
import axios from "axios";

const MembershipForm = ({ memberships, setMemberships }) => {
  const [formData, setFormData] = useState({
    membership_type: "",
    start_date: "",
    end_date: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("/api/memberships", formData).then((response) => {
      setMemberships([...memberships, response.data]);
      setFormData({ membership_type: "", start_date: "", end_date: "" });
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Add Membership</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Membership Type</label>
          <input
            type="text"
            name="membership_type"
            value={formData.membership_type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Add Membership
        </button>
      </form>
    </div>
  );
};

export default MembershipForm;
