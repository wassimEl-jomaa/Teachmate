import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    role_id: "",         // string from <select>, we’ll cast to number on submit
    address: "",
    postal_code: "",
    city: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const makeUsername = (first, last) => {
    const f = (first || "").trim().toLowerCase();
    const l = (last || "").trim().toLowerCase();
    // simple, deterministic username; tweak as you like
    return (f.slice(0, 3) + l.slice(0, 3)) || (f || l) || "user";
  };

  const parseFastApiError = async (res) => {
    let err = {};
    try {
      err = await res.json();
    } catch {
      // ignore json parse error
    }
    if (!err || !err.detail) return "Failed to create user.";
    // detail can be string or list of {msg,...}
    if (Array.isArray(err.detail)) {
      return err.detail.map((d) => d.msg || JSON.stringify(d)).join("; ");
    }
    return err.detail;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!formData.role_id) {
      setError("Please select a role.");
      return;
    }

    const payload = {
      username: makeUsername(formData.first_name, formData.last_name),
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      password: formData.password,
      phone_number: formData.phone_number,
      role_id: Number(formData.role_id), // cast to number for the API
      address: formData.address || undefined,
      postal_code: formData.postal_code || undefined,
      city: formData.city || undefined,
      country: formData.country || undefined,
      // If your backend accepts nested data for Student/Teacher/Parent,
      // you can add optional `student`, `teacher`, or `parent` objects here.
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await parseFastApiError(res);
        throw new Error(msg);
      }

      alert("User created!");
      navigate("/login");
    } catch (e) {
      console.error("Error creating user:", e.message);
      setError(e.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto px-6 py-10">
      <div className="max-w-lg mx-auto bg-white p-8 border rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold text-center mb-6">
          Create an Account
        </h2>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="mb-4">
            <label htmlFor="first_name" className="block text-gray-700 font-semibold">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label htmlFor="last_name" className="block text-gray-700 font-semibold">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-semibold">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label htmlFor="phone_number" className="block text-gray-700 font-semibold">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-semibold">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Role */}
          <div className="mb-4">
            <label htmlFor="role_id" className="block text-gray-700 font-semibold">
              Role (e.g., Student, Teacher, Parent)
            </label>
            <select
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Select Role</option>
              <option value="3">Student</option>
              <option value="2">Teacher</option>
              <option value="4">Parent</option>
            </select>
          </div>

          {/* Address */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-gray-700 font-semibold">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Postal Code */}
          <div className="mb-4">
            <label htmlFor="postal_code" className="block text-gray-700 font-semibold">
              Postal Code
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* City */}
          <div className="mb-4">
            <label htmlFor="city" className="block text-gray-700 font-semibold">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Country */}
          <div className="mb-4">
            <label htmlFor="country" className="block text-gray-700 font-semibold">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className={`${
                submitting ? "opacity-60 cursor-not-allowed" : ""
              } bg-yellow-500 text-white py-2 px-6 rounded-md hover:bg-yellow-600 transition-all`}
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-700">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:text-blue-700">
              Log in here
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default RegisterForm;
