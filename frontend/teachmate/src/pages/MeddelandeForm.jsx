import React, { useState } from "react";
import axios from "axios";

const MeddelandeForm = ({ meddelanden, setMeddelanden }) => {
  const [formData, setFormData] = useState({
    message: "",
    description: "",
    läsa_status: "Unread",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("/api/meddelanden", formData).then((response) => {
      setMeddelanden([...meddelanden, response.data]);
      setFormData({ message: "", description: "", läsa_status: "Unread" });
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Add Meddelande</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Läsa Status</label>
          <select
            name="läsa_status"
            value={formData.läsa_status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Add Meddelande
        </button>
      </form>
    </div>
  );
};

export default MeddelandeForm;
