import React from "react";
import { Link } from "react-router-dom";

const SideBar = () => {
  return (
    <div className="bg-blue-100 py-2 mb-6">
      <div className="sidebar-container">
        <div className="sidebar-logo text-center mb-6">
          <h2 className="text-2xl font-semibold">My App</h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="space-y-4">
            <li>
              <Link
                to="/home"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Profile
              </Link>
            </li>
            <li>
              <Link
                to="/betyg"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Grade
              </Link>
            </li>

            <li>
              <Link
                to="/services"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Feedback & Support
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Ongoing Homework
              </Link>
            </li>
            <li>
              <Link
                to="/meddelande"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Message
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Recommended Resources
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                AI-generated Suggestions
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                className="block py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Motivational Content
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default SideBar;
