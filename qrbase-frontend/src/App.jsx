import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth Components
import SignUp from "./components/SignUp";
import Login from "./components/Login"; 

// Organizer Components
import OrganizerDash from "./components/OrganizerDash";
import Events from "./components/Event"; 
import EventManage from "./components/EventManage";
import Speakers from "./components/Speakers";

// Participant Components
import ParticipantDash from "./components/ParticipantDash";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Public / Auth Routes --- */}
        {/* Redirect root to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* --- Organizer Routes --- */}
        <Route path="/dashboard" element={<OrganizerDash />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id/manage" element={<EventManage />} />
        <Route path="/speakers" element={<Speakers />} />

        {/* --- Participant Routes --- */}
        <Route path="/participant" element={<ParticipantDash />} />
      </Routes>
    </Router>
  );
}

export default App;