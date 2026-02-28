<h1 align="center">🎥 Video Conferencing System</h1>

<p align="center">
  A full-stack, real-time video conferencing application built with the <strong>MERN Stack</strong> and <strong>WebRTC</strong>.
  <br />
  Connect, collaborate, and communicate — directly in your browser.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/WebRTC-Enabled-333?logo=webrtc&logoColor=white&style=for-the-badge" />
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [How to Use](#-how-to-use)
- [NPM Scripts](#-npm-scripts)
- [Deployment Notes](#-deployment-notes)
- [Future Improvements](#-future-improvements)

---

## 🌐 Overview

**Video Conferencing System** is a feature-rich, browser-based video calling platform that enables users to host or join live video meetings instantly — no downloads required. Built on the MERN stack with WebRTC for peer-to-peer media streaming and Socket.io for real-time signaling, the application handles multi-participant video calls, in-meeting chat, and user meeting history, all behind a secure JWT-based authentication system.

---

## ✨ Features

| Feature                        | Description                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| 🎥 **Real-Time Video & Audio** | Peer-to-peer video calling powered by WebRTC with dynamic multi-participant support |
| 💬 **In-Meeting Chat**         | Live chat panel during meetings using Socket.io                                     |
| 🔐 **Secure Authentication**   | JWT-based login & registration with bcrypt password hashing and rate limiting       |
| 📋 **Meeting History**         | Persistent log of all meetings a user has attended, stored in MongoDB               |
| 🎛️ **Meeting Controls**        | Toggle camera/microphone, leave call, and manage media during a session             |
| 🖥️ **Responsive Video Grid**   | Dynamic video tile layout that adapts to the number of participants                 |
| 🌙 **Dark Mode UI**            | Modern dark-themed interface with Material UI components                            |
| 🛡️ **Rate Limiting**           | Brute-force protection on authentication endpoints (10 requests / 15 min)           |

---

## 🛠️ Tech Stack

### Frontend

| Technology               | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| **React 18**             | Component-based UI framework                 |
| **React Router DOM v6**  | Client-side routing and navigation           |
| **Material UI (MUI) v5** | UI component library with dark theme support |
| **Socket.io-client**     | Real-time WebSocket communication            |
| **WebRTC**               | Peer-to-peer audio and video streaming       |
| **Axios**                | HTTP client for REST API calls               |

### Backend

| Technology               | Purpose                               |
| ------------------------ | ------------------------------------- |
| **Node.js**              | JavaScript runtime environment        |
| **Express.js**           | REST API web server framework         |
| **Socket.io**            | WebSocket server for signaling & chat |
| **MongoDB + Mongoose**   | NoSQL database and ODM                |
| **bcrypt**               | Password hashing                      |
| **JSON Web Token (JWT)** | Stateless user authentication         |
| **express-rate-limit**   | API rate limiting middleware          |
| **dotenv**               | Environment variable management       |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                    │
│                                                         │
│  ┌───────────┐   HTTP/REST    ┌──────────────────────┐  │
│  │  React UI │ ◄───────────►  │  Express REST API    │  │
│  │  (Port    │                │  /api/v1/users/...   │  │
│  │   3000)   │   WebSocket    ├──────────────────────┤  │
│  │           │ ◄───────────►  │  Socket.io Server    │  │
│  └─────┬─────┘                │  (Signaling + Chat)  │  │
│        │                      └──────────┬───────────┘  │
│        │  WebRTC (P2P)                  │               │
│        │  SDP + ICE via Socket.io       │ Mongoose      │
│        ▼                                ▼               │
│  ┌─────────────────┐         ┌──────────────────────┐   │
│  │  Remote Peer    │         │  MongoDB Atlas /     │   │
│  │  (Other User)   │         │  Local MongoDB       │   │
│  └─────────────────┘         │  (Users + Meetings)  │   │
│                              └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**How it works:**

1. **Authentication** — Users register/login via REST API. The server validates credentials, hashes passwords with bcrypt, and returns a JWT.
2. **Meeting Rooms** — Each meeting has a unique URL path (e.g., `/abc123`). When a user navigates to it, they join a Socket.io room with that ID.
3. **WebRTC Signaling** — The Socket.io server acts as a signaling relay. Peers exchange SDP offers/answers and ICE candidates through the server to establish a direct P2P media connection.
4. **Chat & Controls** — Chat messages are relayed through Socket.io to all participants in the room. Media controls (mute/unmute, video on/off) are handled locally via the MediaStream API.
5. **History** — When a meeting ends, the session is recorded to MongoDB under the user's activity log, accessible from the History page.

---

## 📁 Project Structure

```
Meet/
├── backend/                    # Node.js + Express server
│   ├── src/
│   │   ├── app.js              # Entry point — Express & Socket.io setup
│   │   ├── controllers/
│   │   │   ├── user.controller.js    # Auth + history business logic
│   │   │   └── socketManager.js      # WebRTC signaling & chat handlers
│   │   ├── middleware/
│   │   │   └── auth.middleware.js    # JWT verification middleware
│   │   ├── models/
│   │   │   ├── user.model.js         # User schema (Mongoose)
│   │   │   └── meeting.model.js      # Meeting/activity schema
│   │   └── routes/
│   │       └── users.routes.js       # API route definitions
│   ├── .env.example            # Environment variable template
│   └── package.json
│
└── frontend/                   # React application
    ├── public/
    └── src/
        ├── App.js              # Root component & route configuration
        ├── pages/
        │   ├── landing.jsx     # Landing / welcome page
        │   ├── authentication.jsx  # Login & Register page
        │   ├── home.jsx        # Dashboard — create or join meeting
        │   ├── VideoMeet.jsx   # Main meeting room page
        │   └── history.jsx     # Meeting history page
        ├── components/
        │   ├── VideoGrid.jsx       # Dynamic video tile grid
        │   ├── MeetingControls.jsx # Camera/mic/leave controls
        │   ├── ChatPanel.jsx       # In-meeting chat UI
        │   └── ui/                 # Shared UI primitives
        ├── hooks/
        │   ├── useWebRTC.js        # WebRTC peer connection logic
        │   └── useMediaStream.js   # Camera/microphone media stream
        ├── contexts/
        │   └── AuthContext.jsx     # Global auth state provider
        ├── utils/                  # Shared utility helpers
        └── environment.js          # API base URL configuration
```

---

## 🚀 Installation & Setup

### Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- [Git](https://git-scm.com/)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/<your-username>/Video_conferencing_system.git
cd Video_conferencing_system
```

---

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 3: Configure Backend Environment Variables

Create a `.env` file inside the `backend/` directory by copying the example:

```bash
# Windows
copy .env 

# macOS / Linux
cp .env
```

Then open `.env` and fill in your values (see [Environment Variables](#-environment-variables) below).

---

### Step 4: Start the Backend Server

```bash
# Development (with auto-reload via nodemon)
npm run dev

# Production
npm start
```

The backend will start at `http://localhost:8000`.

---

### Step 5: Install Frontend Dependencies

Open a **new terminal**, then:

```bash
cd frontend
npm install
```

---

### Step 6: Start the Frontend

```bash
npm start
```

The React app will open at `http://localhost:3000`.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB connection string
# For Atlas: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
# For local: mongodb://localhost:27017/videomeet
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# The URL of your frontend (used for CORS)
CORS_ORIGIN=http://localhost:3000

# Port for the backend server
PORT=8000
```

> **Note:** A `JWT_SECRET` is used internally by the auth middleware. Add it as well if it is referenced in your `auth.middleware.js`:
>
> ```env
> JWT_SECRET=your_super_secret_key_here
> ```

> ⚠️ **Never commit your `.env` file to version control.** It is already included in `.gitignore`.

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

All protected routes require a `token` header or cookie with a valid JWT.

| Method | Endpoint                  | Auth   | Description                      |
| ------ | ------------------------- | ------ | -------------------------------- |
| `POST` | `/users/register`         | No     | Register a new user              |
| `POST` | `/users/login`            | No     | Login and receive a JWT          |
| `POST` | `/users/add_to_activity`  | ✅ Yes | Record a completed meeting       |
| `GET`  | `/users/get_all_activity` | ✅ Yes | Fetch the user's meeting history |

> Authentication endpoints are rate-limited to **10 requests per 15 minutes** per IP.

---

## 📖 How to Use

1. **Register / Login**
   - Navigate to `http://localhost:3000`
   - Click **Get Started** to go to the authentication page
   - Register a new account or log in with existing credentials

2. **Create a Meeting**
   - From the Home dashboard, click **New Meeting**
   - A unique meeting ID is generated — share it with others

3. **Join a Meeting**
   - Paste a meeting ID/link into the **Join Meeting** field and click Join
   - Grant camera and microphone permissions when prompted

4. **In the Meeting Room**
   - Your video appears in the grid alongside other participants
   - Use the **control bar** at the bottom to:
     - 🎤 Mute / unmute your microphone
     - 📷 Turn your camera on / off
     - 📞 Leave the meeting
   - Open the **chat panel** to send messages to all participants

5. **View Meeting History**
   - Click **History** in the navigation
   - See a chronological log of all meetings you have attended

---

## 📜 NPM Scripts

### Backend (`/backend`)

| Script  | Command              | Description                                  |
| ------- | -------------------- | -------------------------------------------- |
| `dev`   | `nodemon src/app.js` | Start server with hot-reload for development |
| `start` | `node src/app.js`    | Start server for production                  |
| `prod`  | `pm2 src/app.js`     | Start server using PM2 process manager       |

### Frontend (`/frontend`)

| Script  | Command               | Description                                |
| ------- | --------------------- | ------------------------------------------ |
| `start` | `react-scripts start` | Start development server on port 3000      |
| `build` | `react-scripts build` | Build optimized production bundle          |
| `test`  | `react-scripts test`  | Run test suite                             |
| `eject` | `react-scripts eject` | Eject from Create React App (irreversible) |

---

## ☁️ Deployment Notes

### Backend Deployment (e.g., Render / Railway / DigitalOcean)

1. Push your code to GitHub (ensure `.env` is in `.gitignore`).
2. Create a new **Web Service** on your hosting provider, pointing to the `backend/` directory.
3. Set the **Start Command** to `npm start`.
4. Add all required environment variables (`MONGODB_URI`, `CORS_ORIGIN`, `PORT`, `JWT_SECRET`) in the provider's dashboard.

### Frontend Deployment (e.g., Vercel / Netlify)

1. Update `frontend/src/environment.js` to point to your deployed backend URL.
2. Deploy the `frontend/` directory.
3. Set the **Build Command** to `npm run build` and the **Output Directory** to `build`.

> ⚠️ **HTTPS is required for WebRTC** in production. Ensure your backend is served over `https://` and your WebSocket connection uses `wss://`.

---

## 🔮 Future Improvements

- [ ] **Screen Sharing** — Allow participants to share their screen during a meeting
- [ ] **Meeting Scheduling** — Calendar integration to schedule and send meeting invites
- [ ] **Recording** — Record meetings and save them to cloud storage
- [ ] **AI Transcription & Summarization** — Auto-generate meeting transcripts and summaries using AI
- [ ] **Breakout Rooms** — Split participants into smaller sub-groups
- [ ] **Whiteboard** — Collaborative real-time drawing canvas
- [ ] **Mobile App** — React Native companion app for iOS and Android
- [ ] **Virtual Backgrounds** — Background blur and custom virtual backgrounds
- [ ] **End-to-End Encryption** — Encrypt media streams for enhanced privacy
- [ ] **Reactions & Raise Hand** — Quick emoji reactions and a raise-hand feature

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">Made with ❤️ using the MERN Stack & WebRTC</p>
