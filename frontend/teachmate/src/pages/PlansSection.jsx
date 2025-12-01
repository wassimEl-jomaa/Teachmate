import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom for navigation

const PlansSection = () => {
  return (
    <div className="flex justify-center space-x-8 mb-8">
      {/* Basic Plan */}
      <div className="mb-8 max-w-xs p-6 bg-gray-200 rounded-lg text-center">
        <div className="font-bold text-xl text-blue-700 mb-2">Grundplan</div>
        <div className="text-4xl font-bold mb-4">130 kr/månad</div>
        <ul className="list-none p-0 mb-4">
          <li className="mb-4">✅ 10GB Lagring</li>
          <li className="mb-4">✅ 1 Användare</li>
          <li className="mb-4">🚫 Support</li>
        </ul>
        {/* Link to RegisterForm */}
        <Link
          to="/register" // Redirect to /register route when clicked
          className="w-full py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Registrera dig
        </Link>
      </div>

      {/* Standard Plan */}
      <div className="mb-8 max-w-xs p-6 bg-gray-200 rounded-lg text-center">
        <div className="font-bold text-xl text-blue-700 mb-2">Standardplan</div>
        <div className="text-4xl font-bold mb-4">250 kr/månad</div>
        <ul className="list-none p-0 mb-4">
          <li className="mb-4">✅ 50GB Lagring</li>
          <li className="mb-4">✅ 5 Användare</li>
          <li className="mb-4">✅ Telefon- & E-postsupport</li>
        </ul>
        {/* Link to RegisterForm */}
        <Link
          to="/register" // Redirect to /register route when clicked
          className="w-full py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Registrera dig
        </Link>
      </div>

      {/* Premium Plan */}
      <div className="max-w-xs p-6 bg-gray-200 rounded-lg text-center">
        <div className="font-bold text-xl text-blue-700 mb-2">Premiumplan</div>
        <div className="text-4xl font-bold mb-4">500 kr/månad</div>
        <ul className="list-none p-0 mb-4">
          <li className="mb-4">✅ 100GB Lagring</li>
          <li className="mb-4">✅ 10 Användare</li>
          <li className="mb-4">✅ 24/7 Support</li>
        </ul>
        {/* Link to RegisterForm */}
        <Link
          to="/register" // Redirect to /register route when clicked
          className="w-full py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          Registrera dig
        </Link>
      </div>
    </div>
  );
};

export default PlansSection;
