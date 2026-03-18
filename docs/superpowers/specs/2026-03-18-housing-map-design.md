# Housing Map — Design Spec

An interactive map application for tracking apartment listings during an apartment search. Users pin apartments on a map, take notes, upload photos, and fill out amenity checklists — with support for multiple floor plans per building.

## Target Users

People actively searching for apartments who want to visualize options geographically and take structured notes during open houses. Mobile-first usage during visits, desktop for planning.

## Core Concepts

- **Pin** — A marker on the map representing an apartment building at a specific address.
- **Floor Plan Tab** — A unit or floor plan within a building. Each pin can have multiple tabs (e.g., "1BR — $1,800", "Studio — $1,400"). Each tab has its own rent, notes, photos, and amenity checklist.
- **Amenity Checklist** — A customizable list of boolean items (AC, heating, dishwasher, etc.). New tabs come pre-populated with default amenities (all unchecked). Users can add/remove items.

## Architecture

**Stack:**
- **Frontend:** React (Vite + TypeScript) with react-leaflet for maps
- **Backend:** Express + TypeScript with Prisma ORM
- **Database:** PostgreSQL
- **Auth:** Passport.js with email/password (JWT tokens)
- **Map tiles:** Leaflet + OpenStreetMap (free, no API key)
- **Geocoding:** Nominatim (OpenStreetMap's free geocoding API) for address search
- **Image storage:** Stored directly in PostgreSQL as binary data (Prisma `Bytes` type). No separate filesystem needed — works with cloud-hosted databases.

**Project structure:**
```
housing-map/
├── client/          # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/   # API client
│   │   └── types/
│   └── ...
├── server/          # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── prisma/
│   └── ...
└── docs/
```

## Data Model

```
User
  id          UUID (PK)
  email       String (unique)
  password    String (hashed)
  createdAt   DateTime

Pin
  id          UUID (PK)
  userId      UUID (FK → User)
  name        String          -- building name, e.g. "Avalon Apartments"
  address     String
  latitude    Float
  longitude   Float
  color       String          -- hex color for the pin marker
  createdAt   DateTime
  updatedAt   DateTime

FloorPlan
  id          UUID (PK)
  pinId       UUID (FK → Pin)
  name        String          -- e.g. "1BR — Unit 4C"
  rent        Integer?        -- monthly rent in cents
  notes       Text
  sortOrder   Integer         -- tab ordering
  createdAt   DateTime
  updatedAt   DateTime

AmenityItem
  id          UUID (PK)
  floorPlanId UUID (FK → FloorPlan)
  label       String          -- e.g. "Air Conditioning"
  checked     Boolean
  sortOrder   Integer

Photo
  id          UUID (PK)
  floorPlanId UUID (FK → FloorPlan)
  data        Bytes           -- image binary data stored directly in DB
  mimeType    String          -- e.g. "image/jpeg", "image/png"
  originalName String         -- user's original filename
  sortOrder   Integer
  createdAt   DateTime
```

**Cascade deletes:** Deleting a Pin deletes all its FloorPlans. Deleting a FloorPlan deletes all its AmenityItems and Photos.

**Default amenities for new floor plans:** AC, Heating, Dishwasher, In-unit Laundry, Parking, Gym (all unchecked). Users can add/remove items per floor plan.

## API Endpoints

All endpoints except auth require a valid JWT in the `Authorization` header.

```
POST   /api/auth/register        { email, password } → { token, user }
POST   /api/auth/login            { email, password } → { token, user }

GET    /api/pins                  → Pin[] (with floor plans, amenities, photos)
POST   /api/pins                  { name, address, lat, lng, color? } → Pin
PUT    /api/pins/:id              { name?, address?, lat?, lng?, color? } → Pin
DELETE /api/pins/:id              → 204

POST   /api/pins/:pinId/floor-plans                    { name, rent?, notes? } → FloorPlan (with default amenities)
PUT    /api/floor-plans/:id                             { name?, rent?, notes?, sortOrder? } → FloorPlan
DELETE /api/floor-plans/:id                             → 204

PUT    /api/amenities/:id                               { checked?, label? } → AmenityItem
POST   /api/floor-plans/:floorPlanId/amenities          { label } → AmenityItem
DELETE /api/amenities/:id                               → 204

POST   /api/floor-plans/:floorPlanId/photos             multipart/form-data → Photo
GET    /api/photos/:id/image                            → binary image data (with correct Content-Type)
DELETE /api/photos/:id                                  → 204
```

**GET /api/pins** returns the full nested structure for the logged-in user — pins with their floor plans, each floor plan with its amenities and photo URLs. This is the main data load on app startup.

## UI Layout

### Desktop

- **Top bar:** App logo/name, address search input, "+ Add Pin" button, "☰ List" toggle, user menu
- **Main area:** Full-screen Leaflet map with pin markers
- **Right sidebar (toggleable):** Scrollable list of all apartments with name, address, floor plan count, and amenity summary tags. Clicking an item centers the map and opens its popup.
- **Pin popup (read mode):** Overlay on the map showing building name/address, floor plan tabs, and the active tab's rent, notes, photo thumbnails, and amenity tags. Has an "Edit" button.
- **Edit panel:** Slides in from the right replacing the sidebar. Building-level fields (name, address) at top, then floor plan tabs with per-tab fields: plan name, rent, notes, photo upload area, and 2-column amenity checklist with toggles. Save/Cancel/Delete Tab buttons.

### Mobile (responsive, breakpoint ~768px)

- **Map view (default tab):** Full-screen map with search bar at top, floating "+" action button, bottom navigation (Map / List / Account)
- **Pin tapped → bottom sheet:** Slides up from bottom with drag handle. Shows building name/address, horizontally scrollable floor plan tabs, active tab's details (notes, photos, amenity tags). "Edit" button in header.
- **Edit mode → full screen:** Full-screen form with Cancel/Save in header. Building fields, then floor plan tabs, then per-tab fields. Amenities as tappable tag-style checkboxes.
- **List view (bottom nav tab):** Scrollable cards for each apartment with name, address, plan count, price range, and amenity summary.

### Adding a New Floor Plan Tab

1. Click/tap "+ Add" next to existing tabs
2. New tab appears in edit mode with empty fields and default amenities (all unchecked)
3. Name field is auto-focused
4. Save creates the tab; Cancel discards and returns to previous tab

### Adding a New Pin

Two methods:
1. **Search:** Type address in search bar → geocode via Nominatim → preview marker on map → confirm to create pin
2. **Click map:** Click any point on map → reverse geocode to get address → confirm/edit address → create pin

Both methods open the edit panel for the new pin with one empty floor plan tab.

## Authentication Flow

- **Register:** Email + password → server hashes password (bcrypt), creates user, returns JWT
- **Login:** Email + password → verify → return JWT
- **Session:** JWT stored in localStorage, sent as Bearer token. Frontend redirects to login page if token is missing/expired.
- **Pages:** Login and Register pages. Unauthenticated users see only these pages.

## Image Upload

- Images uploaded as multipart/form-data to the server
- Server stores image binary data directly in PostgreSQL (`Bytes` column)
- Images served via `GET /api/photos/:id/image` which reads from DB and responds with the correct `Content-Type` header
- Max file size: 10MB per image
- Accepted formats: JPEG, PNG, WebP
- **GET /api/pins** returns photo metadata (id, originalName) but not the binary data — images are loaded on demand via their individual endpoints

## Error Handling

- Backend returns consistent JSON error responses: `{ error: string, details?: string }`
- Frontend shows toast notifications for errors (network failures, validation errors)
- Optimistic updates for checklist toggles (revert on failure)
- Loading states for async operations (map load, save, upload)

## Testing Strategy

- **Backend:** Integration tests for API endpoints using a test database
- **Frontend:** Component tests with React Testing Library for key flows (add pin, edit floor plan, toggle amenity)
- **E2E:** Optional Playwright tests for critical paths (register → login → add pin → edit → verify)
