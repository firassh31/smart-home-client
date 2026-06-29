# Smart Home Dashboard (MSHome)

MSHome is a smart-home dashboard featuring a decoupled architecture. It manages parent and child accounts, device inventory, room filtering, and real-time device control (on/off, brightness, temperature, and lock state).

## 🌐 Live Demo
The application is fully deployed and accessible online:
** https://smart-home-client-olive.vercel.app/ **



## 🏗 Architecture & Tech Stack

* **Frontend:** HTML5, CSS3, and vanilla JavaScript.
* **Separation of Concerns:** 100% strict separation. Zero inline JavaScript. All logic, DOM manipulation, and routing are handled cleanly via event listeners in `main.js`.
* **Backend:** Node.js, Express, MongoDB Atlas.
* **Deployment:** Vercel (Frontend) & Render (Backend).

## ✨ Core Features

* **Authentication:** Secure parent/child flows with JWT sessions.
* **Family Access:** Parent accounts generate a family invite code; child accounts join using this code.
* **Role-Based UI:** Child accounts have restricted access (cannot manage inventory).
* **Dynamic Dashboard:** Real-time filtering by room and device control via REST API.
* **Weather Widget:** Fetches real-time weather data securely via a backend proxy.

## 📁 Project Structure

### Client (Frontend)
```text
smart-home-client/
  css/style.css        # Responsive styling
  js/main.js           # API logic, routing, and event listeners
  login.html           # Login view
  register.html        # Registration view
  dashboard.html       # Main dynamic device dashboard
```
### Server (Backend)
```text
smart-home-node/
  config/              # MongoDB connection
  controllers/         # Request handlers
  middleware/          # JWT and role authorization
  routes/              # API endpoints
  server.js            # API startup
```
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
