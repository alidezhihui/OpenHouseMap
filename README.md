# Housing Map

A full-stack web app for tracking apartments during your housing search. Drop pins on an interactive map, compare floor plans, manage amenities, and upload photos — all in one place.

## Tech Stack

**Client:** React, TypeScript, Vite, Leaflet / React-Leaflet, Axios

**Server:** Express.js, TypeScript, Prisma, PostgreSQL, JWT auth

**Storage:** AWS S3 / MinIO (photo uploads via presigned URLs)

**Infra:** Docker Compose (PostgreSQL + MinIO)

## Features

- Interactive map with click-to-place pins and reverse geocoding (Nominatim)
- Multiple floor plans per apartment with rent, notes, and amenities
- Photo uploads (direct-to-S3 via presigned URLs)
- Amenity checklist with defaults + custom amenities
- Sidebar listing with hover-to-highlight map pins
- Responsive layout (desktop sidebar + mobile bottom nav/sheet)
- JWT authentication with login/register

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd housing-map
cd server && npm install
cd ../client && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 3. Start PostgreSQL + MinIO
docker-compose up -d

# 4. Initialize database
cd server
npx prisma generate
npx prisma db push

# 5. Run dev servers
# Terminal 1 — backend (port 3001)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Open http://localhost:5173, register an account, and start pinning apartments.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://housing:housing@localhost:5432/housing_map` | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-production` | Secret for signing JWTs |
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint (MinIO locally) |
| `S3_ACCESS_KEY` | `minioadmin` | S3 access key |
| `S3_SECRET_KEY` | `minioadmin` | S3 secret key |
| `S3_BUCKET` | `housing-map-photos` | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |
| `PORT` | `3001` | Backend server port |

## Project Structure

```
housing-map/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── components/       # MapView, EditPanel, Sidebar, etc.
│       ├── pages/            # MapPage, LoginPage, RegisterPage
│       ├── hooks/            # useAuth, usePins, useMediaQuery
│       ├── services/         # API client modules
│       └── types/            # TypeScript interfaces
├── server/                   # Express backend
│   └── src/
│       ├── routes/           # auth, pins, floorPlans, amenities, photos
│       ├── middleware/       # JWT auth middleware
│       ├── services/         # S3 integration
│       ├── prisma/           # Database schema
│       └── __tests__/        # Vitest test suite
├── docker-compose.yml        # PostgreSQL + MinIO
└── .env.example
```

## Scripts

```bash
# Client
cd client
npm run dev           # Start dev server (port 5173)
npm run build         # Production build
npm run lint          # ESLint

# Server
cd server
npm run dev           # Start dev server (port 3001)
npm run build         # Compile TypeScript
npm run test          # Run tests (Vitest)
npx prisma studio    # Database GUI
```

## API

All endpoints (except auth) require a `Bearer` token in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (email + password) |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/pins` | List user's pins |
| POST | `/api/pins` | Create pin with first floor plan |
| PUT | `/api/pins/:id` | Update pin |
| DELETE | `/api/pins/:id` | Delete pin (cascades) |
| POST | `/api/pins/:pinId/floor-plans` | Add floor plan |
| PUT | `/api/floor-plans/:id` | Update floor plan |
| DELETE | `/api/floor-plans/:id` | Delete floor plan |
| POST | `/api/floor-plans/:fpId/amenities` | Add custom amenity |
| PUT | `/api/amenities/:id` | Toggle/edit amenity |
| DELETE | `/api/amenities/:id` | Delete amenity |
| POST | `/api/floor-plans/:fpId/photos/presign` | Get upload URL |
| DELETE | `/api/photos/:id` | Delete photo |
