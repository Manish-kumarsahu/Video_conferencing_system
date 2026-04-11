import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>NexaMeet</h2>
        </div>
        <div className="navlist">
          <p onClick={() => router("/aljk23")}>Join as Guest</p>
          <p onClick={() => router("/auth", { state: { mode: "register" } })}>Register</p>
          <div className="navLoginBtn" onClick={() => router("/auth")} role="button">
            Login
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span>Connect, Collaborate</span><br />and Communicate Smarter
          </h1>
          <p>Experience real-time transcription and AI-generated summaries with NexaMeet.</p>
          <div role="button">
            <Link to="/auth" state={{ mode: "register" }}>Get Started →</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="Video conferencing preview" />
        </div>
      </div>
    </div>
  );
}
