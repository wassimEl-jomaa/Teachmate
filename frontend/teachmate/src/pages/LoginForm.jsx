import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import decodeToken from "../utils/utils";

export default function LoginForm({
  signedIn,
  role,
  setSignedIn,
  setRole,
  setUserId,
}) {
  const [email, setEmail] = useState(""); // State for email
  const [password, setPassword] = useState(""); // State for password
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submit

    // Simple validation
    if (!email || !password) {
      setErrorMessage("Vänligen fyll i både e-post och lösenord.");
    } else {
      setErrorMessage(""); // Clear error message if form is valid
      try {
        const response = await axios.post(
          `http://${process.env.BASE_URL}:8000/get_user_by_email_and_password`,
          {
            email,
            password,
          }
        );

        const { token } = response.data; // Extract token, user ID, and role from the response
        localStorage.setItem("token", token); // Store the token in localStorage
        const message = decodeToken(token).split("|"); // Decode the token
        setSignedIn(true); // Log the user in
        setRole(message[1]); // Set the user's role
        setUserId(message[0]); // Set the user's ID
        navigate("/minsida"); // Redirect to the user's personal page otherwise
      } catch (error) {
        console.error("Error logging in:", error);
        setErrorMessage("Fel användarnamn eller lösenord");
      }
    }
  };

  useEffect(() => {
    if (signedIn) {
      if (role === "Admin") {
        navigate("/admin"); // Redirect to admin page if the user is an admin
      } else if (role.toLowerCase() === "teacher") {
        navigate("/teacher"); // Redirect to teacher page if the user is a teacher
      } else {
        navigate("/minsida"); // Redirect to the user's personal page otherwise
      }
    }
  }, [signedIn, role, navigate]);
  return (
    <div className="bg-gray-100">
      {/* Main Section */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md">
          <h2 className="text-3xl font-semibold text-center mb-6">Logga In</h2>

          {/* Login Form */}
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 font-semibold"
              >
                E-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Handle email input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Handle password input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div id="error-message" className="text-red-500 mt-4 text-center">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-blue-200 text-xl font-semibold text-center py-2 px-6 rounded-md hover:bg-blue-600 transition-all"
              >
                Log in
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-700">
              Don't have an account?
              <Link
                to="/register"
                className="text-blue-500 hover:text-blue-700"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
