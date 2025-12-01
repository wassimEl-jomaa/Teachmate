import React from "react";

const Entry = ({ title, dueDate, status, onComplete }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-gray-500">Förfallodatum: {dueDate}</p>
        <p
          className={`text-sm ${
            status === "Klar"
              ? "text-green-500"
              : status === "Försenad"
              ? "text-red-500"
              : "text-yellow-500"
          }`}
        >
          {status}
        </p>
      </div>
      {status !== "Klar" && (
        <button
          onClick={onComplete}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-all"
        >
          Markera som Klar
        </button>
      )}
    </div>
  );
};

export default Entry;
