import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageHomework = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [homeworkData, setHomeworkData] = useState({
    title: "",
    description: "",
    due_date: "",
    status: "Pending",
    priority: "Normal",
    user_id: "",
    subject_id: "",
    teacher_id: "",
    class_level_id: "",
  });
  const [assignmentType, setAssignmentType] = useState("single");
  const [editingHomeworkId, setEditingHomeworkId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      try {
        const [
          teachersResponse,
          subjectsResponse,
          classLevelsResponse,
          homeworksResponse,
          studentHomeworksResponse, // New API call
        ] = await Promise.all([
          axios.get("http://127.0.0.1:8000/teachers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/subjects", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/class_levels", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/homeworks", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://127.0.0.1:8000/student_homeworks", {
            // New endpoint
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTeachers(teachersResponse.data);
        setSubjects(subjectsResponse.data);
        setClassLevels(classLevelsResponse.data);
        setHomeworks(homeworksResponse.data);
        setStudentHomeworks(studentHomeworksResponse.data); // Store in state
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Failed to fetch data.");
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !homeworkData.title ||
      !homeworkData.description ||
      !homeworkData.due_date ||
      !homeworkData.subject_id ||
      (assignmentType === "single" && !homeworkData.user_id) ||
      (assignmentType === "all" && !homeworkData.class_level_id)
    ) {
      setErrorMessage("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: homeworkData.title,
        description: homeworkData.description,
        due_date: homeworkData.due_date,
        status: homeworkData.status,
        priority: homeworkData.priority,
        subject_id: homeworkData.subject_id,
        teacher_id: homeworkData.teacher_id,
        ...(assignmentType === "single" && { user_id: homeworkData.user_id }), // For single assignment
        ...(assignmentType === "all" && {
          class_level_id: homeworkData.class_level_id,
        }), // For all class level
      };

      // Add or update homework
      if (editingHomeworkId) {
        const response = await axios.put(
          `http://localhost:8000/homeworks/${editingHomeworkId}/`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHomeworks((prevHomeworks) =>
          prevHomeworks.map((homework) =>
            homework.id === editingHomeworkId ? response.data : homework
          )
        );
        setSuccessMessage("Homework updated successfully!");
      } else {
        const response = await axios.post(
          "http://localhost:8000/homeworks/",
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHomeworks((prevHomeworks) => [...prevHomeworks, response.data]);
        setSuccessMessage("Homework added successfully!");
      }

      // Reset form and state
      setHomeworkData({
        title: "",
        description: "",
        due_date: "",
        status: "Pending",
        priority: "Normal",
        user_id: "",
        subject_id: "",
        teacher_id: "",
        class_level_id: "",
      });
      setEditingHomeworkId(null);
      setErrorMessage(""); // Clear error message
    } catch (error) {
      console.error("Error managing homework:", error);
      setErrorMessage("Failed to manage homework. Please try again.");
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleDelete = async (homeworkId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/homeworks/${homeworkId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHomeworks((prevHomeworks) =>
        prevHomeworks.filter((homework) => homework.id !== homeworkId)
      );
      setSuccessMessage("Homework deleted successfully!");
      setErrorMessage(""); // Clear error message
    } catch (error) {
      console.error("Error deleting homework:", error);
      setErrorMessage("Failed to delete homework. Please try again.");
      setSuccessMessage(""); // Clear success message
    }
  };

  const handleEdit = (homework) => {
    setHomeworkData({
      title: homework.title,
      description: homework.description,
      due_date: homework.due_date,
      status: homework.status,
      priority: homework.priority,
      user_id: homework.user_id,
      subject_id: homework.subject_id,
      teacher_id: homework.teacher_id,
      class_level_id: homework.class_level_id,
    });
    setEditingHomeworkId(homework.id);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHomeworkData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center tracking-wide leading-tight">
        HomeWork Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {/* Student Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">
            Homework for one student
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Add Homework
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Homework
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Homework by class Level
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get homework by Teacher
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Update a Homework
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Delete a Homework
            </button>
          </div>
        </div>

        {/* Parents Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">
            Homework for Class Level
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Add Homework
            </button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Homework
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Homeworks by class Level
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Homeworks by Teacher
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Update a Homework
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Delete a Homework
            </button>
          </div>
        </div>

        {/* Teachers Section */}
        <div className="bg-white p-6 rounded-lg shadow-xl border border-blue-200">
          <h2 className="text-2xl font-semibold text-blue-700 mb-6">
            Homeworks
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            ></button>
            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get all Homeworks by Subject
            </button>

            <button
              onClick={() => {}}
              className="w-full py-3 px-6 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition transform hover:scale-105 duration-300"
            >
              Get Teachers by Student Name
            </button>
          </div>
        </div>
      </div>
      {/* New Container with Form */}

      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">
          Show Homework
        </h2>

        {/* Error and success messages */}
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-green-500 text-sm mb-4">{successMessage}</p>
          )}
        </form>

        <h2 className="text-2xl font-bold mt-8 mb-6">Existing Homework</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Student Name
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Title
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Description
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Due Date
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Status
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Teacher
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Subject
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Class Level
                </th>
                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Grade
                </th>

                <th className="py-3 px-6 border-b text-left text-gray-700 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {studentHomeworks.map((studentHomework) => (
                <tr key={studentHomework.id} className="hover:bg-gray-100">
                  {/* Student Name */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.student?.user?.first_name &&
                    studentHomework.student?.user?.last_name
                      ? `${studentHomework.student.user.first_name} ${studentHomework.student.user.last_name}`
                      : "N/A"}
                  </td>

                  {/* Homework Title */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.title || "N/A"}
                  </td>

                  {/* Homework Description */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.description || "N/A"}
                  </td>

                  {/* Homework Due Date */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.due_date || "N/A"}
                  </td>

                  {/* Homework Status */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.status || "N/A"}
                  </td>

                  {/* Teacher Name */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.subject_class_level?.teacher
                      ?.user?.first_name &&
                    studentHomework.homework?.subject_class_level?.teacher?.user
                      ?.last_name
                      ? `${studentHomework.homework.subject_class_level.teacher.user.first_name} ${studentHomework.homework.subject_class_level.teacher.user.last_name}`
                      : "N/A"}
                  </td>

                  {/* Subject Name */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.homework?.subject_class_level?.subject
                      ?.name || "N/A"}
                  </td>

                  {/* Class Level Name */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.student?.class_level?.name ||
                      studentHomework.homework?.subject_class_level?.class_level
                        ?.name ||
                      "N/A"}
                  </td>

                  {/* Grade */}
                  <td className="py-3 px-6 border-b">
                    {studentHomework.grade || "Not Graded"}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-6 border-b">
                    <button
                      onClick={() => handleEdit(studentHomework)}
                      className="text-blue-500 hover:text-blue-700 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(studentHomework.id)}
                      className="text-red-500 hover:text-red-700"
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
    </div>
  );
};

export default ManageHomework;
