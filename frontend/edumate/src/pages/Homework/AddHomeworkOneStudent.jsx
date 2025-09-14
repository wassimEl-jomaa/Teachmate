import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import decodeToken from "../../utils/utils";

const AddHomeworkOneStudent = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classLevelId, setClassLevelId] = useState(""); // State for subject_class_level_id
  const [subjectClassLevelId, setSubjectClassLevelId] = useState(""); // State for subject_class_level_id
  const [subjectClassLevels, setSubjectClassLevels] = useState([]); // State for subject-class-level combinations,
  const [studentNames, setStudentNames] = useState([]); // State for subject-class-level combinations
  const [studentNameId, setStudentNameId] = useState([]); // State for subject-class-level combinations
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Pending");
  const [students, setStudents] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchSubjectClassLevels = async () => {
      const token = localStorage.getItem("token");
      const message = decodeToken(token).split("|"); // Decode the token
      const userId = message[0]; // Set the user's ID
      console.log(userId);
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/subject_class_levels?user_id=${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched Subject Class Levels:", response.data); // Debugging log
        setSubjectClassLevels(response.data); // Populate the state with the fetched data
      } catch (error) {
        console.error("Error fetching subject class levels:", error);
        setErrorMessage("Failed to fetch subject class levels.");
      }
    };

    fetchSubjectClassLevels();
  }, []);

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, ""); // Remove < and > characters
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    let requestBody = {
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      due_date: dueDate, // Ensure this is in "YYYY-MM-DD" format
      priority,
      status,
      subject_class_level_id: parseInt(subjectClassLevelId, 10), // Convert to integer
    };

    console.log("Request Body:", requestBody); // Debugging log

    try {
      let response = await axios.post(
        "http://127.0.0.1:8000/homework/",
        requestBody,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      requestBody = {
        student_id: parseInt(studentNameId, 10),
        homework_id: parseInt(response.data["id"], 10),
      };
      await axios.post("http://127.0.0.1:8000/student_homeworks", requestBody, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("Homework added successfully!");
      setErrorMessage("");
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("Normal");
      setStatus("Pending");
      setSubjectClassLevelId("");

      alert("Homework added successfully!");
    } catch (error) {
      console.error("Error adding homework:", error.response?.data || error);
      setErrorMessage("Failed to add homework. Please try again.");
      setSuccessMessage("");
    }
  };

  useEffect(() => {
    const fetchStudentNames = async () => {
      if (!classLevelId) return; // Don't fetch if classLevelId is not set
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/students/class_level/${classLevelId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Fetched Class Levels:", response.data); // Debugging log
        setStudentNames(response.data); // Populate the state with the fetched data
      } catch (error) {
        console.error("Error fetching subject class levels:", error);
        setErrorMessage("Failed to fetch subject class levels.");
      }
    };

    fetchStudentNames();
  }, [classLevelId]);

  // Remove the above useEffect: students are fetched by class level and stored in studentNames

  console.log("studentNames", studentNames); 
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-wide leading-tight">
        Add Homework
      </h1>

      {errorMessage && (
        <p className="text-red-500 text-sm mb-4 text-center">{errorMessage}</p>
      )}
      {successMessage && (
        <p className="text-green-500 text-sm mb-4 text-center">
          {successMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-xl border border-gray-200"
      >
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-gray-700 font-semibold mb-2"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-gray-700 font-semibold mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        <div className="mb-6">
          <label
            htmlFor="dueDate"
            className="block text-gray-700 font-semibold mb-2"
          >
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="priority"
            className="block text-gray-700 font-semibold mb-2"
          >
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="status"
            className="block text-gray-700 font-semibold mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="subjectClassLevel"
            className="block text-gray-700 font-semibold mb-2"
          >
            Subject and Class Level
          </label>
          <select
            id="subjectClassLevel"
            value={`${subjectClassLevelId},${classLevelId}`}
            onChange={(e) => {
              setSubjectClassLevelId(e.target.value.split(",")[0]); // Set the subject_class_level_id state
              setClassLevelId(e.target.value.split(",")[1]); // Set the subject_class_level_id state
            }}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a Subject and Class Level</option>
            {subjectClassLevels.map((subjectClassLevel) => (
              <option
                key={subjectClassLevel.id}
                value={`${subjectClassLevel.id},${subjectClassLevel.class_level_id}`}
              >
                {subjectClassLevel.subject.name} -{" "}
                {subjectClassLevel.class_level.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label
            htmlFor="studentName"
            className="block text-gray-700 font-semibold mb-2"
          >
            Student Name
          </label>
          <select
            id="studentName"
            value={studentNameId}
            onChange={(e) => setStudentNameId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Student</option>
            {studentNames.map(student => (
              <option key={student.id} value={student.id}>
                {student.user.first_name} {student.user.last_name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
        >
          Add Homework
        </button>
      </form>
    </div>
  );
};

export default AddHomeworkOneStudent;
