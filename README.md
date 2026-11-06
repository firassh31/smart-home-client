# Smart Home Dashboard (MSHome)

MSHome is a smart-home dashboard featuring a decoupled architecture. It manages parent and child accounts, SMS phone verification, device inventory, room filtering, and real-time device control (on/off, brightness, temperature, and lock state).

## 🌐 Live Demo
The application is fully deployed and accessible online:
** https://smart-home-client-olive.vercel.app/ **

## 🏗 Architecture & Tech Stack

* **Frontend:** HTML5, CSS3, and vanilla JavaScript — no frameworks.
* **Separation of Concerns:** 100% strict separation. Zero inline JavaScript. All logic, DOM manipulation, and routing are handled cleanly via event listeners in `main.js`.
* **Backend:** Node.js, Express, MongoDB Atlas.
* **Deployment:** Vercel (Frontend) & Render (Backend).

## ✨ Core Features

* **Authentication:** Register with username, email, phone number, and password. Log in with username, **email, or phone number**. JWT sessions stored in `localStorage`.
* **Phone Verification (SMS OTP):** After registration the user confirms a 6-digit SMS code on `verify.html` — auto-advance between digits, paste support, auto-submit, and a 60-second resend timer. The session token is stored only after the code is confirmed.
* **Family Access:** Parent accounts generate a family invite code; child accounts join using this code.
* **Role-Based UI:** Child accounts have restricted access (cannot manage inventory).
* **Dynamic Dashboard:** Real-time filtering by room and device control via REST API.
* **Weather Widget:** Fetches real-time weather data securely via a backend proxy.

## 📁 Project Structure

### Client (Frontend)
```text
smart-home-client/
  css/style.css        # Responsive styling (design tokens in :root)
  js/main.js           # API logic, auth + OTP flows, dashboard behavior
  index.html           # Login view (username / email / phone)
  register.html        # Registration view (with phone number)
  verify.html          # SMS OTP verification view (6-digit input)
  dashboard.html       # Main dynamic device dashboard
```
### Server (Backend)
```text
smart-home-node/
  config/              # MongoDB connection
  models/              # Collection schemas + indexes (TTL OTP, unique phone)
  controllers/         # Auth, OTP, and device request handlers
  middleware/          # JWT and role authorization
  routes/              # API endpoints (auth routes are rate limited)
  services/            # SMS (Twilio), email (Nodemailer), device observers
  server.js            # API startup
```

## 🔐 Auth Flow

1. **Register** (`register.html`) → account created, welcome email sent, OTP sent via SMS.
2. **Verify** (`verify.html`) → the 6-digit code is checked server-side (hashed, 10-minute expiry, max 5 attempts); on success the JWT is stored and the user lands on the dashboard.
3. **Login** (`index.html`) → any of username / email / phone + password.

In development (no Twilio credentials on the server) the OTP is printed to the server console / Render logs instead of being sent by SMS.

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Creates an account (name, email, phone_number, password, role, familyCode). |
| `POST` | `/auth/login` | Authenticates with username, email, or phone + password. Returns a JWT. |
| `POST` | `/auth/send-otp` | Sends (or resends) the SMS verification code. |
| `POST` | `/auth/verify-otp` | Verifies the code, marks the phone verified, returns a fresh JWT. |
| `GET` | `/devices/types` | Returns supported device types. |
| `GET` | `/devices/` | Fetches devices visible to the current user. |
| `GET` | `/devices/stats` | Aggregated on/off counts for the dashboard stats. |
| `POST` | `/devices/` | Creates a new device. Parent only. |
| `PUT` | `/devices/:id` | Updates device metadata. Parent only. |
| `PUT` | `/devices/:id/status` | Updates device on/off status. |
| `PUT` | `/devices/:id/state` | Updates nested device state fields. |
| `DELETE` | `/devices/:id` | Deletes a device. Parent only. |
