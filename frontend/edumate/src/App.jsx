import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FeaturesSection from "./pages/FeaturesSection";
import HowItWorksSection from "./pages/HowItWorksSection";
import PlansSection from "./pages/PlansSection";
import RegisterForm from "./pages/RegisterForm";
import LoginForm from "./pages/LoginForm";
import MinSida from "./pages/MinSida";
import PersonligLärplan from "./pages/PersonligLärplan";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import AddRole from "./pages/AddRole";
import Profil from "./pages/Profil";
import Admin from "./pages/Admin";
import ManageUsers from "./pages/ManageUsers";
import ManageMemberships from "./pages/ManageMemberships";
import ManageArskurs from "./pages/ManageArskurs";
import ManageMeddelanden from "./pages/ManageMeddelanden";
import ManageHomework from "./pages/ManageHomework";
import MeddelandePage from "./pages/MeddelandePage";
import BetygPage from "./pages/BetygPage";
import ManageSubjects from "./pages/ManageSubjects";
import decodeToken from "./utils/utils";
import Teachers from "./pages/Teachers";
import ManageBetyg from "./pages/ManageBetyg";
import ManageTeachers from "./pages/ManageTeacher";
import ShowAllHomework from "./pages/Homework/ShowAllHomework";
import AddHomeworkOneStudent from "./pages/Homework/AddHomeworkOneStudent";
import AddHomeworkAllClass from "./pages/Homework/AddHomeworkAllClass";

const App = () => {
  var message = null;
  const user_token = localStorage.getItem("token"); // Store the token in localStorage
  if (user_token) {
    message = decodeToken(user_token).split("|"); // Decode the token
  }
  const [signedIn, setSignedIn] = useState(user_token ? true : false);
  const [userId, setUserId] = useState(message && message[0] ? message[0] : "");
  const [role, setRole] = useState(message && message[1] ? message[1] : "");
  const teacherId = message && message[2] ? message[2] : "";

  console.log("userId:", userId);
  console.log("teacherId:", teacherId);

  return (
    <div className="bg-gray-100">
      <Header signedIn={signedIn} setSignedIn={setSignedIn} role={role} />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <FeaturesSection />
              <HowItWorksSection />
              <PlansSection />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <LoginForm
              signedIn={signedIn}
              role={role}
              setSignedIn={setSignedIn}
              setRole={setRole}
              setUserId={setUserId}
            />
          }
        />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/profil" element={<Profil userId={userId} />} />
        <Route path="/minsida" element={<MinSida userId={userId} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/personliglarplan" element={<PersonligLärplan />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/add-role" element={<AddRole />} />
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path="/manage-memberships" element={<ManageMemberships />} />
        <Route path="/manage-arskurs" element={<ManageArskurs />} />
        <Route path="/manage-subjects" element={<ManageSubjects />} />
        <Route path="/manage-meddelanden" element={<ManageMeddelanden />} />
        <Route path="/manage-homework" element={<ManageHomework />} />
        <Route path="/" element={<ManageHomework />} />
        <Route path="/add-homework" element={<AddHomeworkOneStudent />} />
        
        <Route path="/add-homework-class" element={<AddHomeworkAllClass />} />
        <Route path="/add-class-homework" element={<AddHomeworkAllClass />} /> {/* alias */}
        <Route path="/homeworks" element={<ShowAllHomework />} />
        <Route
          path="/teacher"
          element={<Teachers teacherId={teacherId} userId={userId} />}
        />
        <Route path="/minsida" element={<MinSida userId={Number(userId) || 0} />} />

        <Route path="/manage-teachers" element={<ManageTeachers />} />
        <Route
          path="/meddelande"
          element={<MeddelandePage userId={userId} />}
        />
        <Route
          path="/betyg"
          element={
            role === "Student" ? (
              <BetygPage />
            ) : role === "Admin" || role === "Teacher" ? (
              <ManageBetyg userId={userId} />
            ) : (
              <div className="p-6 text-red-500">Access Denied</div>
            )
          }
        />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
