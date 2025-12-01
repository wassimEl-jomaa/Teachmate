export const TeacherCard = ({ teacher, onEdit, onDelete }) => {
  const placeholderImage = "https://via.placeholder.com/150?text=No+Image";

  // Construct the teacher's full name
  const teacherName = teacher.user
    ? `${teacher.user.first_name} ${teacher.user.last_name}`
    : "Unknown";

  // Get teacher's email, phone number, and subject name
  const email = teacher.user?.email || "Not Available";
  const phoneNumber = teacher.user?.phone_number || "Not Available";
  const subjectName = teacher.subject?.name || "Not Assigned";

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <img
        src={teacher.photo || placeholderImage}
        alt={`${teacherName}'s photo`}
        className="w-full h-40 object-cover rounded-md mb-4"
      />
      <h3 className="text-xl font-bold">{teacherName}</h3>
      <p className="text-gray-700">Email: {email}</p>
      <p className="text-gray-700">Phone: {phoneNumber}</p>
      <p className="text-gray-700">Subject: {subjectName}</p>
      <div className="mt-4">
        <button
          onClick={() => onEdit(teacher)} // Pass the teacher object to the onEdit function
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-2"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(teacher.id)} // Pass the teacher ID to the onDelete function
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
