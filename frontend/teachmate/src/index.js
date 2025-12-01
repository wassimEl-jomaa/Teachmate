import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Use BrowserRouter here
import App from "./App"; // Import your App component
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
console.log("Base URL:", process.env.REACT_APP_BASE_URL);

root.render(
  <React.StrictMode>
    <Router>
      {" "}
      {/* Only wrap the entire app in a Router here */}
      <App />
    </Router>
  </React.StrictMode>
);
