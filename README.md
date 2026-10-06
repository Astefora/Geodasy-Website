# Disaster Monitoring Center (DMC)

A full-stack web application for real-time natural hazard monitoring across Ethiopia, developed for the **Geodesy & Geodynamics Department, Ethiopian Space Science and Geospatial Institute (SSGI)**.

The platform integrates live satellite and sensor data from multiple international sources to monitor six hazard domains — earthquake, flood, fire, drought, landslide, and volcano — and provides an early warning system, a research data portal, and a member management dashboard.

---

## Features

- **Six hazard monitoring pages** — interactive Leaflet maps with live data, regional risk scoring, and analytical sections for each hazard type
- **Early Warning System** — real-time alert monitoring with severity filtering, regional risk cards, and SMS/email subscription management
- **Research Portal** — browse, filter, and download approved datasets submitted by department members
- **LEO Member Dashboard** — authenticated portal for submitting local disaster observations and research uploads, with an admin approval workflow
- **Admin Panel** — manage user approvals, content, and submissions
- **Light / Dark mode** — full theme switching across all pages
- **Responsive design** — works on desktop, tablet, and mobile

---

## Tech Stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Frontend       | React 19, React Router, React-Leaflet, Tailwind CSS, Chart.js |
| Backend        | Node.js, Express                                              |
| Database       | MongoDB (via Mongoose)                                        |
| Authentication | JWT, bcrypt, cookie-based remember-me                         |
| File Uploads   | Multer                                                        |
| Email          | Nodemailer                                                    |
| Maps           | Leaflet, NASA GIBS MODIS tiles                                |

---

## External Data Sources

| Source               | Used For                                       |
| -------------------- | ---------------------------------------------- |
| USGS Earthquake API  | Live seismic events in Ethiopia                |
| NASA FIRMS (VIIRS)   | Active fire hotspot detection                  |
| NASA GIBS MODIS      | Land surface temperature tiles (drought page)  |
| GloFAS               | River discharge flood risk (Awash River)       |
| COMET Volcano Portal | InSAR deformation data for Ethiopian volcanoes |
| FloodScan            | Historical flood extent statistics by region   |

---

## Project Structure

```
geod/
├── backend/                  # Node.js/Express API server
│   ├── models/               # Mongoose schemas (User, Upload, AlertSubscription, etc.)
│   ├── data/                 # Static data files (FloodScan JSON)
│   ├── uploads/              # Uploaded files (gitignored)
│   ├── alertService.js       # Alert notification logic
│   └── server.js             # Main server entry point
│
└── frontend/                 # React application
    ├── public/               # Static assets, map GeoJSON files
    └── src/
        ├── Componenet/       # Shared reusable components (Header, Footer, maps, etc.)
        ├── Pages/            # Page components
        │   ├── EarlyWarning/ # Early warning sub-components
        │   ├── Earthquake.js
        │   ├── Flood.js
        │   ├── Fire.js
        │   ├── Drought.js
        │   ├── Landslide.js
        │   ├── Volcano.js
        │   ├── EarlyWarning.js
        │   ├── Research.js
        │   ├── Dashboard.js
        │   ├── About.js
        │   └── Home.js
        ├── styles/           # Global CSS files
        ├── App.js            # Root component and routing
        └── ThemeContext.js   # Light/dark mode context
```

---

## Prerequisites

- **Node.js** v18 or later
- **MongoDB** — running locally or a MongoDB Atlas connection string
- **npm** v9 or later

---

## Environment Variables

### Backend — `backend/.env`

Create this file before starting the server:

```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/disaster-monitoring
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Nodemailer (for alert email notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin credentials
ADMIN_EMAIL=admin@ssgi.gov.et
ADMIN_PASSWORD=your_admin_password
```

### Frontend — `frontend/.env`

```env
REACT_APP_API_BASE=http://localhost:5002
```

> **Important:** Never commit `.env` files. They are listed in `.gitignore`.

---

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Astefora/Geodasy-Website.git
cd Geodasy-Website
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

## Running the Application

### Start the backend server

```bash
cd backend
npm start
```

The API server will start on **http://localhost:5002**

### Start the frontend development server

Open a second terminal:

```bash
cd frontend
npm start
```

The React app will open at **http://localhost:3000**

The frontend is pre-configured to proxy API requests to `http://localhost:5002` via the `"proxy"` field in `frontend/package.json`, so no CORS configuration is needed in development.

---

## Building for Production

```bash
cd frontend
npm run build
```

The production build will be output to `frontend/build/`. Serve it with any static file server or configure the Express backend to serve it directly.

---

## API Overview

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`        | Register a new member              |
| POST   | `/api/auth/login`           | Login and receive JWT              |
| POST   | `/api/auth/logout`          | Logout and clear session           |
| GET    | `/api/uploads`              | List approved uploads (filterable) |
| POST   | `/api/uploads`              | Submit a new upload                |
| PUT    | `/api/uploads/:id`          | Edit an upload                     |
| DELETE | `/api/uploads/:id`          | Delete an upload                   |
| GET    | `/api/users`                | List members (admin only)          |
| PUT    | `/api/users/:id/approve`    | Approve a member                   |
| GET    | `/api/alerts/subscriptions` | Get alert subscriptions            |
| POST   | `/api/alerts/subscribe`     | Subscribe to alerts                |
| POST   | `/api/contact`              | Send contact form message          |
| GET    | `/api/content`              | Get CMS home page content          |

---

## Default Admin Access

After starting the server with the admin credentials set in `backend/.env`, navigate to `/admin-login` to access the admin panel. The admin account is seeded automatically on first run if it does not exist.

---

## Notes

- The `backend/uploads/` directory is created automatically by Multer on first file upload. It is gitignored and should not be committed.
- The application polls several external APIs on page load. If an API is unavailable, the relevant section will show a fallback state rather than crashing.
- The frontend proxy only applies in development. In production, configure your web server (e.g., Nginx) to forward `/api` requests to the backend.

---

## License

Developed as an internship project at the **Geodesy & Geodynamics Department, Space Science and Geospatial Institute (SSGI)**, Addis Ababa, Ethiopia.
