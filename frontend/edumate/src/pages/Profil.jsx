import React, { useState, useEffect } from "react";
import axios from "axios";

const Alert = ({ type = "success", message, onClose }) => {
  const palette = {
    success: {
      bg: "bg-green-50",
      text: "text-green-800",
      ring: "ring-green-200",
      icon: "✅",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-800",
      ring: "ring-red-200",
      icon: "⚠️",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      ring: "ring-blue-200",
      icon: "ℹ️",
    },
  };
  const p = palette[type];

  if (!message) return null;
  return (
    <div
      className={`${p.bg} ${p.text} ring-1 ${p.ring} rounded-lg p-3 flex items-start gap-3 animate-[fadeIn_200ms_ease-in-out] mb-4`}
    >
      <div className="text-lg">{p.icon}</div>
      <div className="flex-1 text-sm">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="text-xs opacity-70 hover:opacity-100"
      >
        Stäng
      </button>
    </div>
  );
};

const Profil = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [teacherClasses, setTeacherClasses] = useState([]); // For teacher's classes

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Fetching user data for userId:", userId);

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        
        // Use the correct backend URL (127.0.0.1:8000 to match other components)
        const response = await axios.get(
          `http://127.0.0.1:8000/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000, // 10 second timeout
          }
        );
        console.log("Fetched user data:", response.data);
        setUser(response.data);

        // If user is a teacher, fetch their classes
        if (response.data.role === 'teacher') {
          try {
            const classesResponse = await axios.get(
              `http://127.0.0.1:8000/class_levels/teacher/${userId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 10000,
              }
            );
            console.log("Teacher classes:", classesResponse.data);
            setTeacherClasses(classesResponse.data || []);
          } catch (classError) {
            console.error("Error fetching teacher classes:", classError);
            // Don't set error message for this as it's not critical
            setTeacherClasses([]);
          }
        }
      } catch (error) {
        console.error(
          "Error fetching user data:",
          error.response?.data || error.message
        );
        
        let errorMsg = "Kunde inte hämta användardata.";
        if (error.code === 'ECONNABORTED') {
          errorMsg = "Timeout - servern svarar inte. Försök igen.";
        } else if (error.response?.status === 404) {
          errorMsg = "Användare hittades inte.";
        } else if (error.response?.status === 401) {
          errorMsg = "Du är inte behörig att se denna profil.";
        } else if (error.response?.data?.detail) {
          errorMsg = error.response.data.detail;
        }
        
        setErrorMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    } else {
      setLoading(false);
      setErrorMessage("Inget användar-ID tillhandahållet.");
    }
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!user.first_name?.trim() || !user.last_name?.trim()) {
      setErrorMessage("Förnamn och efternamn krävs.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      const token = localStorage.getItem("token");
      const updateData = {
        first_name: user.first_name.trim(),
        last_name: user.last_name.trim(),
        phone_number: user.phone_number?.trim() || "",
        address: user.address?.trim() || "",
        school: user.school?.trim() || "", // Add school field
      };

      console.log("Updating user with data:", updateData);

      const response = await axios.patch(
        `http://127.0.0.1:8000/users/${userId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      
      console.log("Updated user data:", response.data);
      setUser(response.data);
      setIsEditing(false);
      setSuccessMessage("Profilen uppdaterades framgångsrikt!");
    } catch (error) {
      console.error("Error updating user data:", error);
      
      let errorMsg = "Kunde inte uppdatera profilen.";
      if (error.code === 'ECONNABORTED') {
        errorMsg = "Timeout - servern svarar inte. Försök igen.";
      } else if (error.response?.status === 401) {
        errorMsg = "Du är inte behörig att uppdatera denna profil.";
      } else if (error.response?.status === 422) {
        errorMsg = "Ogiltig data. Kontrollera att alla fält är korrekt ifyllda.";
      } else if (error.response?.data?.detail) {
        const detail = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map(d => d.msg).join(", ")
          : error.response.data.detail;
        errorMsg = detail;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage("");
    setSuccessMessage("");
    // Reset any unsaved changes by refetching user data
    if (userId) {
      const token = localStorage.getItem("token");
      axios.get(`http://127.0.0.1:8000/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => setUser(response.data))
      .catch(error => console.error("Error refetching user data:", error));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Laddar profil...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Ingen användardata</h2>
          <p className="text-gray-600">Kunde inte ladda profilinformation.</p>
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content Section */}
      <div className="flex-1 p-8 bg-white shadow-lg rounded-lg max-w-4xl mx-auto mt-6">
        <h1 className="text-4xl font-semibold text-center mb-8 text-blue-900">
          Profil
        </h1>

        {/* Feedback alerts */}
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
        <Alert 
          type="error" 
          message={errorMessage} 
          onClose={() => setErrorMessage("")} 
        />

        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-blue-300 object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iNjQiIGZpbGw9IiNEM0Q3REUiLz4KPHN2ZyB4PSIzMiIgeT0iMzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjNjM3Mzg1Ij4KPHA+dGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPgo8L3N2Zz4KPC9zdmc+";
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-blue-300 bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* User's Name and Email */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700">
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.name || "Okänt namn"
            }
          </h2>
          <p className="text-lg text-gray-600">{user.email || "Ingen e-post"}</p>
          {user.role && (
            <p className="text-sm text-blue-600 font-medium capitalize">
              Roll: {user.role}
            </p>
          )}
        </div>

        {/* Toggle Edit/View Mode Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {isEditing ? "Avbryt Ändringar" : "Redigera Profil"}
          </button>
        </div>

        {/* Profile Information */}
        <form onSubmit={handleFormSubmit}>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              Personlig Information
            </h3>
            <div className="space-y-4">
              {/* Edit fields only appear when in edit mode */}
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Förnamn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={user.first_name || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Förnamn"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efternamn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={user.last_name || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Efternamn"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefonnummer
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={user.phone_number || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Telefonnummer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adress
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={user.address || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Adress"
                    />
                  </div>
                  {/* Add school field for teachers/admins */}
                  {(user.role === 'teacher' || user.role === 'admin') && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Skola (arbetar på)
                      </label>
                      <input
                        type="text"
                        name="school"
                        value={user.school || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Skolans namn"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <strong className="text-gray-700">Förnamn:</strong>
                      <p className="text-gray-900">{user.first_name || "Ej angivet"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <strong className="text-gray-700">Efternamn:</strong>
                      <p className="text-gray-900">{user.last_name || "Ej angivet"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <strong className="text-gray-700">Telefonnummer:</strong>
                      <p className="text-gray-900">{user.phone_number || "Ej angivet"}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <strong className="text-gray-700">Adress:</strong>
                      <p className="text-gray-900">{user.address || "Ej angivet"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Student/Class Information */}
                    {user.student && (
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Skola:</strong>
                          <p className="text-blue-900">
                            {user.student.class_level?.school || "Ej angivet"}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Klass:</strong>
                          <p className="text-blue-900">
                            {user.student.class_level?.name || "Ej tilldelad"}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Årskurs:</strong>
                          <p className="text-blue-900">
                            {user.student.class_level?.grade || "Ej angivet"}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {/* Teacher Information */}
                    {user.role === 'teacher' && (
                      <>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <strong className="text-green-700">Arbetar på:</strong>
                          <p className="text-green-900">
                            {user.school || "Ej angivet"}
                          </p>
                        </div>
                        {teacherClasses.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <strong className="text-green-700">Undervisar klasser:</strong>
                            <div className="mt-1">
                              {teacherClasses.map((classLevel, index) => (
                                <div key={classLevel.id} className="text-green-900 text-sm">
                                  {index + 1}. {classLevel.name} 
                                  {classLevel.grade && ` (${classLevel.grade})`}
                                  {classLevel.school && ` - ${classLevel.school}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Admin Information */}
                    {user.role === 'admin' && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <strong className="text-purple-700">Arbetar på:</strong>
                        <p className="text-purple-900">
                          {user.school || "Ej angivet"}
                        </p>
                      </div>
                    )}
                    
                    {/* Legacy data fallback */}
                    {!user.student && user.arskurs && (
                      <>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Skola:</strong>
                          <p className="text-blue-900">{user.arskurs.skola || "Ej angivet"}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Klass:</strong>
                          <p className="text-blue-900">{user.arskurs.klass || "Ej angivet"}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <strong className="text-blue-700">Årskurs:</strong>
                          <p className="text-blue-900">{user.arskurs.name || "Ej angivet"}</p>
                        </div>
                      </>
                    )}

                    {/* User ID for reference */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <strong className="text-gray-700">Användar-ID:</strong>
                      <p className="text-gray-900 font-mono text-sm">{user.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button to Save Changes */}
          {isEditing && (
            <div className="text-center space-y-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sparar...
                  </span>
                ) : (
                  "Spara Ändringar"
                )}
              </button>
              <p className="text-xs text-gray-500">
                * Obligatoriska fält
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profil;