import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";

const VideoMeetComponent = lazy(() => import("./pages/VideoMeet"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const History = lazy(() => import("./pages/history"));
const MeetingTranscript = lazy(() => import("./pages/MeetingTranscript"));

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff'}}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
  
              <Route path="/auth" element={<Authentication />} />
  
              <Route path="/home" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/meeting/:meetingCode" element={<MeetingTranscript />} />
              <Route path="/:url" element={<VideoMeetComponent />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
