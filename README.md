# Ethiopia Disaster Dashboard

Full-stack React + Node.js + MongoDB application for near real-time hazard monitoring.

---

## Quick Start

### Run both frontend and backend together (recommended)

```bash
npm run dev
```

This uses `concurrently` to start:

- **Backend** → http://localhost:5002
- **Frontend** → http://localhost:3000

### Run separately (two terminals)

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm start
```

---

## Prerequisites

| Requirement | Version | Notes                   |
| ----------- | ------- | ----------------------- |
| Node.js     | 18+     |                         |
| MongoDB     | 6+      | Must be running locally |
| npm         | 9+      |                         |

### Start MongoDB

```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

---

## Environment Variables (`.env`)

```env
MONGO_URI=mongodb://127.0.0.1:27017/geod
BACKEND_PORT=5002
REACT_APP_FIRMS_MAP_KEY=your_firms_key_here
```

Get a free FIRMS key at: https://firms.modaps.eosdis.nasa.gov/api/map_key/

---

## API Routes

| Method | Route                | Description                           |
| ------ | -------------------- | ------------------------------------- |
| GET    | `/api/health`        | Backend health check                  |
| POST   | `/api/uploads`       | Upload a file (multipart/form-data)   |
| GET    | `/api/uploads`       | List all uploads (`?hazardType=fire`) |
| GET    | `/api/uploads/:id`   | Get single upload                     |
| DELETE | `/api/uploads/:id`   | Delete upload + file from disk        |
| GET    | `/api/firms/*`       | FIRMS fire data proxy                 |
| GET    | `/uploads/:filename` | Serve uploaded files                  |

---

## Fixing ECONNREFUSED

`Proxy error: Could not proxy request /api/uploads from localhost:3000 to http://localhost:5002/ (ECONNREFUSED)`

This means the **backend is not running**. Fix:

1. Open a terminal and run: `npm run server`
2. Verify it started: visit http://localhost:5002/api/health
3. Then start the frontend: `npm start`

Or use `npm run dev` to start both at once.

### Other causes

- **Wrong port**: `package.json` proxy must point to `http://localhost:5002`
- **MongoDB not running**: backend exits immediately if Mongo is unreachable
- **Firewall**: check Windows Firewall isn't blocking port 5002

### Test backend independently

```bash
# Health check
curl http://localhost:5002/api/health

# List uploads
curl http://localhost:5002/api/uploads

# Upload a file
curl -X POST http://localhost:5002/api/uploads \
  -F "file=@test.pdf" \
  -F "title=Test Upload" \
  -F "hazardType=fire"
```

---

## Project Structure

```
geod/
├── server.js              # Express backend
├── models/
│   └── Upload.js          # Mongoose schema
├── uploads/               # Uploaded files (auto-created)
├── .env                   # Environment variables
├── package.json           # Scripts + proxy config
└── src/
    ├── App.js             # Routes
    ├── Pages/
    │   ├── Fire.js        # FIRMS fire monitoring
    │   ├── Drought.js     # NASA MODIS drought
    │   ├── Earthquake.js  # USGS earthquake data
    │   ├── Flood.js
    │   ├── Landslide.js
    │   ├── Volcano.js
    │   ├── Research.js    # View uploaded research
    │   └── UploadPage.js  # Upload research files
    ├── Componenet/
    │   ├── EthiopiaMask.js    # SVG clip-path for NASA overlays
    │   ├── LocalDisasterData.js
    │   └── Header.js
    └── styles/
        └── GlobalDataCard.css
```
