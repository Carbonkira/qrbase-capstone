import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import VerificationPage from "./components/VerificationPage";
import ResultPage from "./components/ResultPage";
import Login from "./components/Login"; 
import OrganizerDash from "./components/OrganizerDash";
import ParticipantDash from "./components/ParticipantDash";
import LandingPage from "./components/LandingPage";
import Events from "./components/Event";
import Role from "./components/Role";
import Attendance from "./components/attendance";
import QR from "./components/QR";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<OrganizerDash />} />
        <Route path="/participant" element={<ParticipantDash />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/role" element={<Role />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/qr" element={<QR />} />
      </Routes>
    </Router>
  );
}

export default App;
