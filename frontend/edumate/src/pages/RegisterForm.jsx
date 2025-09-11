import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for programmatic routing

const RegisterForm = () => {
  const navigate = useNavigate(); // Initialize the useNavigate hook
  // Skapa state för formulärdata
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
<<<<<<< HEAD
    role_id: "",
    address: "",
    postal_code: "",
    city: "",
    country: "",
=======
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
  });

  // Skapa en state för eventuella fel
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Add a state for the form key
  const [formKey, setFormKey] = useState(0); // Initialize formKey state

  // Hantera formulärändringar
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field: ${name}, Value: ${value}`); // Debugging log
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Hantera form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Lösenorden matchar inte.");
    } else {
<<<<<<< HEAD
=======
      // Här kan du skicka formuläruppgifter till en server eller API
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
      const data = {
        username:
          formData.first_name.substring(0, 3) +
          formData.last_name.substring(0, 3),
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
<<<<<<< HEAD
        role_id: formData.role_id, // Ensure role_id is included
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        country: formData.country,
      };

      console.log("Data sent to backend:", data); // Debugging log

=======
      };
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
      const options = {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        mode: "cors",
        body: JSON.stringify(data),
      };
      try {
        const result = await fetch(`http://localhost:8000/users/`, options);
        if (!result.ok) {
          const errorData = await result.json();
          throw new Error(
            errorData.detail || "Det gick inte att skapa användaren."
          );
        }
<<<<<<< HEAD
        alert("User created!");
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: "",
          password: "",
          confirmPassword: "",
          role_id: "",
          address: "",
          postal_code: "",
          city: "",
          country: "",
        });
        setFormKey((prevKey) => prevKey + 1);
=======
        alert("Användare skapades!");
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
        navigate("/login");
      } catch (error) {
        console.error("Error creating user:", error.message);
        setError(error.message);
      }
    }
  };

  return (
    <main className="container mx-auto px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white p-8 border rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold text-center mb-6">
          Skapa ett Konto
        </h2>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
<<<<<<< HEAD

        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div>
=======
        <form onSubmit={handleSubmit}>
          {/* Namn */}
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="first_name"
              className="block text-gray-700 font-semibold"
            >
              Förnamn
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

<<<<<<< HEAD
          {/* Last Name */}
          <div>
=======
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="last_name"
              className="block text-gray-700 font-semibold"
            >
              Efternamn
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

<<<<<<< HEAD
          {/* Email */}
          <div>
=======
          {/* E-post */}
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="email"
              className="block text-gray-700 font-semibold"
            >
              E-post
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="new-email" // Use 'new-email' to prevent autofill for email
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

<<<<<<< HEAD
          {/* Phone Number */}
          <div>
=======
          {/* Telefonnummer */}
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="phone_number"
              className="block text-gray-700 font-semibold"
            >
              Telefonnummer
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

<<<<<<< HEAD
          {/* Password */}
          <div>
=======
          {/* Lösenord */}
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="password"
              className="block text-gray-700 font-semibold"
            >
              Lösenord
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password" // Use 'new-password' to disable autofill for password
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)} // Toggle showPassword state
                  className="form-checkbox h-4 w-4 text-yellow-500"
                />
                <span className="ml-2 text-gray-700">Show Password</span>
              </label>
            </div>
          </div>

<<<<<<< HEAD
          {/* Confirm Password */}
          <div>
=======
          {/* Bekräfta Lösenord */}
          <div className="mb-4">
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 font-semibold"
            >
              Bekräfta Lösenord
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

<<<<<<< HEAD
          {/* Role */}
          <div>
            <label
              htmlFor="role_id"
              className="block text-gray-700 font-semibold"
            >
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
          <div>
            <label
              htmlFor="address"
              className="block text-gray-700 font-semibold"
            >
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
          <div>
            <label
              htmlFor="postal_code"
              className="block text-gray-700 font-semibold"
            >
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
          <div>
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
          <div>
            <label
              htmlFor="country"
              className="block text-gray-700 font-semibold"
            >
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

=======
>>>>>>> parent of b8e1959 (FIX same Buge   after i have update the tables i Database)
          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-yellow-500 text-white py-2 px-6 rounded-md hover:bg-yellow-600 transition-all"
            >
              Registrera
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-700">
            Har du redan ett konto?{" "}
            <a href="/login" className="text-blue-500 hover:text-blue-700">
              Logga in här
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default RegisterForm;
