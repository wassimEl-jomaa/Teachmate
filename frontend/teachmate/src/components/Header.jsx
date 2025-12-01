import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Header({ signedIn, setSignedIn, role }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = () => {
    setSignedIn(false); // Log the user out
    localStorage.removeItem("token"); // Remove the token from localStorage
  };

  // Toggle mobile menu visibility
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  console.log("role", role);
  return (
    <header className="bg-blue-100 py-4 mb-4 shadow-lg">
      <nav className="mx-auto flex justify-between items-center px-6 md:px-12">
        {/* Left section: Logo, Home, About Us */}
        <div className="flex items-center space-x-6">
          <img
            src="/Edumate_transparent-logo.png"
            alt="Logo"
            className="h-12 w-auto"
          />
          <div className="hidden md:flex space-x-6">
            <Link
              to="/"
              className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
            >
              Home
            </Link>
            <Link
              to="/aboutUs"
              className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
            >
              About Us
            </Link>
          </div>
        </div>

        {/* Right section: Login/Register or Profile/Logout */}
        <div className="hidden md:flex space-x-6 ml-auto">
          {!signedIn ? (
            <div className="flex space-x-6">
              <Link
                to="/login"
                className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex space-x-6">
              {role === "Admin" && (
                <Link
                  to="/admin"
                  className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Admin
                </Link>
              )}
              {role === "Teacher" && (
                <Link
                  to="/teacher"
                  className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Teacher
                </Link>
              )}
              <Link
                to="/Profil"
                className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
              >
                Profile
              </Link>
             
              <Link
                to="/"
                onClick={logout}
                className="font-bold text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
              >
                Sign out
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-blue-100">
          <div className="px-6 py-4 space-y-4">
            {!signedIn ? (
              <>
                <Link
                  to="/admin"
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Admin
                </Link>
                <Link
                  to="/login"
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/Profil"
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Profile
                </Link>
                <Link
                  to="/MinSida"
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  My page
                </Link>
                <Link
                  to="/"
                  onClick={logout}
                  className="block text-xl text-white bg-blue-400 px-4 py-2 rounded hover:bg-blue-300 transition-all"
                >
                  Sign out
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
