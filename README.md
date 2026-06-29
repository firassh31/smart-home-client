Smart Home Dashboard (MSHome)
MSHome is a smart-home dashboard application featuring a decoupled architecture. It manages parent and child accounts, device inventory, room filtering, and real-time device control (on/off, brightness, temperature, and lock state).

🌐 Live Demo
The application is fully deployed and accessible online:
[INSERT_VERCEL_URL]

Note: The backend is hosted on Render and may take 30-50 seconds to "wake up" upon the first request.

🏗 Architecture & Tech Stack
Frontend: HTML5, CSS3, and vanilla JavaScript (De-coupled).

Backend: Node.js and Express.

Database: MongoDB Atlas.

Security: JWT authentication, role-based access control, and environment variable management (dotenv).

✨ Core Features
Authentication: Secure parent/child flows with JWT sessions.

Family Access: Parent accounts generate a family invite code; child accounts join using this code.

Role-Based UI: Child accounts have restricted access (cannot manage inventory).

Dynamic Dashboard: Real-time filtering by room and device control via REST API.

Weather Widget: Fetches real-time weather data securely via a backend proxy.

Modern Structure: Multi-page architecture (login, register, dashboard) with strict separation of concerns (zero inline JavaScript).

📁 Project Structure
Client (Frontend)
Plaintext
smart-home-client/
  css/style.css        # Responsive styling
  js/main.js           # API logic, routing, and event listeners
  login.html           # Login view
  register.html        # Registration view
  dashboard.html       # Dynamic device control dashboard
Server (Backend)
Plaintext
smart-home-node/
  config/              # MongoDB connection
  controllers/         # Request handlers
  middleware/          # JWT and role authorization
  routes/              # API endpoints
  server.js            # API startup

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Creates a parent account or child account. |
| `POST` | `/auth/login` | Authenticates a user and returns a JWT. |
| `GET` | `/devices/types` | Returns supported device types. |
| `GET` | `/devices/` | Fetches devices visible to the current user. |
| `POST` | `/devices/` | Creates a new device. Parent only. |
| `PUT` | `/devices/:id` | Updates device metadata. Parent only. |
| `PUT` | `/devices/:id/status` | Updates device on/off status. |
| `PUT` | `/devices/:id/state` | Updates nested device state fields. |
| `DELETE` | `/devices/:id` | Deletes a device. Parent only. |
