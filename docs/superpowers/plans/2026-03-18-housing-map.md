# Housing Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive map application where users pin apartments, take notes with photos, and fill out amenity checklists — with multiple floor plan tabs per building.

**Architecture:** React SPA (Vite) talks to an Express REST API backed by PostgreSQL (Prisma ORM). Leaflet + OpenStreetMap for maps. S3-compatible storage (MinIO locally) for photos via presigned URLs. JWT auth with Passport.js.

**Tech Stack:** React, TypeScript, Vite, react-leaflet, Express, Prisma, PostgreSQL, Passport.js, AWS SDK (S3), MinIO, Vitest, React Testing Library, Supertest

---

## File Structure

```
housing-map/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/index.ts                    # Shared TypeScript types (Pin, FloorPlan, etc.)
│       ├── services/api.ts                   # Axios instance + auth header
│       ├── services/pins.ts                  # Pin CRUD API calls
│       ├── services/floorPlans.ts            # FloorPlan API calls
│       ├── services/amenities.ts             # Amenity API calls
│       ├── services/photos.ts               # Photo presign + upload
│       ├── services/auth.ts                  # Login/register API calls
│       ├── hooks/useAuth.tsx                 # Auth context + hook
│       ├── hooks/usePins.ts                  # Pin data fetching + mutations
│       ├── pages/LoginPage.tsx
│       ├── pages/RegisterPage.tsx
│       ├── pages/MapPage.tsx                 # Main page: map + sidebar + popups
│       ├── components/TopBar.tsx
│       ├── components/MapView.tsx            # Leaflet map + pin markers
│       ├── components/PinPopup.tsx           # Read-mode popup with floor plan tabs
│       ├── components/EditPanel.tsx          # Edit panel (right side / full screen mobile)
│       ├── components/FloorPlanTabs.tsx      # Tab bar + active tab content
│       ├── components/AmenityChecklist.tsx   # Checklist with add/remove/toggle
│       ├── components/PhotoGallery.tsx       # Photo thumbnails + upload
│       ├── components/Sidebar.tsx            # Right sidebar apartment list
│       ├── components/BottomSheet.tsx        # Mobile bottom sheet
│       ├── components/BottomNav.tsx          # Mobile bottom navigation
│       ├── components/AddressSearch.tsx      # Geocoding search input
│       └── components/Toast.tsx              # Toast notification
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                          # Express app entry point
│       ├── app.ts                            # Express app setup (middleware, routes)
│       ├── prisma/
│       │   └── schema.prisma
│       ├── middleware/auth.ts                # JWT verification middleware
│       ├── routes/auth.ts                    # POST /api/auth/register, /api/auth/login
│       ├── routes/pins.ts                    # GET/POST/PUT/DELETE /api/pins
│       ├── routes/floorPlans.ts              # POST/PUT/DELETE /api/floor-plans
│       ├── routes/amenities.ts              # POST/PUT/DELETE /api/amenities
│       ├── routes/photos.ts                 # POST presign, DELETE
│       ├── services/s3.ts                    # S3 client + presign/delete helpers
│       └── __tests__/
│           ├── helpers.ts                    # Test setup: DB reset, auth helper
│           ├── auth.test.ts
│           ├── pins.test.ts
│           ├── floorPlans.test.ts
│           ├── amenities.test.ts
│           └── photos.test.ts
├── docker-compose.yml                        # PostgreSQL + MinIO for local dev
├── .env.example
└── docs/
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/src/app.ts`
- Create: `client/package.json` (via Vite scaffold)
- Create: `client/vite.config.ts`

- [ ] **Step 1: Create docker-compose.yml for PostgreSQL + MinIO**

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: housing
      POSTGRES_PASSWORD: housing
      POSTGRES_DB: housing_map
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

- [ ] **Step 2: Create .env.example**

```env
# .env.example
DATABASE_URL="postgresql://housing:housing@localhost:5432/housing_map"
JWT_SECRET="change-me-in-production"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="housing-map-photos"
S3_REGION="us-east-1"
PORT=3001
```

- [ ] **Step 3: Start services and create MinIO bucket**

```bash
docker compose up -d
# Wait for MinIO to start, then create the bucket via MinIO CLI or console
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/housing-map-photos
docker compose exec minio mc anonymous set download local/housing-map-photos
```

- [ ] **Step 4: Initialize server project**

```bash
cd server
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken passport passport-jwt @prisma/client @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install -D typescript @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/passport-jwt @types/multer prisma ts-node tsx vitest supertest @types/supertest
npx tsc --init
```

- [ ] **Step 5: Configure server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Create server/src/app.ts**

```typescript
import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
```

- [ ] **Step 7: Create server/src/index.ts**

```typescript
import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- [ ] **Step 8: Add server scripts to package.json**

Add to `server/package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}
```

- [ ] **Step 9: Scaffold client with Vite**

```bash
cd ..
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom axios react-leaflet leaflet
npm install -D @types/leaflet
```

- [ ] **Step 10: Configure client/vite.config.ts with API proxy**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
```

- [ ] **Step 11: Verify both projects start**

```bash
# Terminal 1
cd server && cp ../.env.example .env && npm run dev
# Terminal 2
cd client && npm run dev
```

Visit `http://localhost:5173`. Confirm the server health endpoint works at `http://localhost:3001/api/health`.

- [ ] **Step 12: Commit**

```bash
git add docker-compose.yml .env.example server/ client/ .gitignore
git commit -m "feat: scaffold project with Vite React client and Express server"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Create: `server/src/prisma/schema.prisma`
- Modify: `server/package.json` (add prisma scripts)

- [ ] **Step 1: Create Prisma schema**

```prisma
// server/src/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  pins      Pin[]
}

model Pin {
  id         String      @id @default(uuid())
  userId     String
  name       String
  address    String
  latitude   Float
  longitude  Float
  color      String      @default("#3b82f6")
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  user       User        @relation(fields: [userId], references: [id])
  floorPlans FloorPlan[]
}

model FloorPlan {
  id        String        @id @default(uuid())
  pinId     String
  name      String
  rent      Int?
  notes     String        @default("")
  sortOrder Int           @default(0)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  pin       Pin           @relation(fields: [pinId], references: [id], onDelete: Cascade)
  amenities AmenityItem[]
  photos    Photo[]
}

model AmenityItem {
  id          String    @id @default(uuid())
  floorPlanId String
  label       String
  checked     Boolean   @default(false)
  sortOrder   Int       @default(0)
  floorPlan   FloorPlan @relation(fields: [floorPlanId], references: [id], onDelete: Cascade)
}

model Photo {
  id           String    @id @default(uuid())
  floorPlanId  String
  storageKey   String
  url          String
  mimeType     String
  originalName String
  sortOrder    Int       @default(0)
  createdAt    DateTime  @default(now())
  floorPlan    FloorPlan @relation(fields: [floorPlanId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
cd server
npx prisma migrate dev --name init --schema src/prisma/schema.prisma
```

Expected: Migration created, database tables generated.

- [ ] **Step 3: Verify with Prisma Studio**

```bash
npx prisma studio --schema src/prisma/schema.prisma
```

Confirm all 5 tables exist: User, Pin, FloorPlan, AmenityItem, Photo.

- [ ] **Step 4: Commit**

```bash
git add server/src/prisma/ server/package.json
git commit -m "feat: add Prisma schema with all models and initial migration"
```

---

## Task 3: Auth Routes (Register + Login)

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/routes/auth.ts`
- Create: `server/src/__tests__/helpers.ts`
- Create: `server/src/__tests__/auth.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create test helpers**

```typescript
// server/src/__tests__/helpers.ts
import { PrismaClient } from "@prisma/client";
import app from "../app.js";
import supertest from "supertest";

export const prisma = new PrismaClient();
export const request = supertest(app);

export async function resetDb() {
  await prisma.photo.deleteMany();
  await prisma.amenityItem.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.pin.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser() {
  const res = await request
    .post("/api/auth/register")
    .send({ email: "test@test.com", password: "password123" });
  return res.body as { token: string; user: { id: string; email: string } };
}
```

- [ ] **Step 2: Write auth tests**

```typescript
// server/src/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb } from "./helpers.js";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ email: "new@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("new@test.com");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("rejects duplicate email", async () => {
    await request
      .post("/api/auth/register")
      .send({ email: "dup@test.com", password: "password123" });

    const res = await request
      .post("/api/auth/register")
      .send({ email: "dup@test.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("rejects missing fields", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ email: "a@b.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request
      .post("/api/auth/register")
      .send({ email: "login@test.com", password: "password123" });
  });

  it("returns a token for valid credentials", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("login@test.com");
  });

  it("rejects wrong password", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "login@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd server && npx vitest run src/__tests__/auth.test.ts
```

Expected: FAIL — routes not defined yet.

- [ ] **Step 4: Implement auth middleware**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthRequest extends Request {
  userId?: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

- [ ] **Step 5: Implement auth routes**

```typescript
// server/src/routes/auth.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed },
  });

  const token = generateToken(user.id);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
```

- [ ] **Step 6: Wire auth routes into app.ts**

```typescript
// server/src/app.ts
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

export default app;
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
cd server && npx vitest run src/__tests__/auth.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add server/src/
git commit -m "feat: add auth routes with register, login, and JWT middleware"
```

---

## Task 4: Pin CRUD Routes

**Files:**
- Create: `server/src/routes/pins.ts`
- Create: `server/src/__tests__/pins.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write pin tests**

```typescript
// server/src/__tests__/pins.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/pins", () => {
  it("returns empty array when no pins", async () => {
    const res = await request
      .get("/api/pins")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request.get("/api/pins");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/pins", () => {
  it("creates a pin and returns it with a default floor plan", async () => {
    const res = await request
      .post("/api/pins")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Avalon Apartments",
        address: "123 Main St, Redmond, WA",
        latitude: 47.674,
        longitude: -122.121,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Avalon Apartments");
    expect(res.body.floorPlans).toHaveLength(1);
    expect(res.body.floorPlans[0].amenities).toHaveLength(6);
  });
});

describe("PUT /api/pins/:id", () => {
  it("updates a pin", async () => {
    const create = await request
      .post("/api/pins")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Old Name",
        address: "123 Main St",
        latitude: 47.0,
        longitude: -122.0,
      });

    const res = await request
      .put(`/api/pins/${create.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });
});

describe("DELETE /api/pins/:id", () => {
  it("deletes a pin and its floor plans", async () => {
    const create = await request
      .post("/api/pins")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "To Delete",
        address: "456 St",
        latitude: 47.0,
        longitude: -122.0,
      });

    const res = await request
      .delete(`/api/pins/${create.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    const get = await request
      .get("/api/pins")
      .set("Authorization", `Bearer ${token}`);
    expect(get.body).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/pins.test.ts
```

Expected: FAIL — route not defined.

- [ ] **Step 3: Implement pin routes**

```typescript
// server/src/routes/pins.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_AMENITIES = [
  "AC",
  "Heating",
  "Dishwasher",
  "In-unit Laundry",
  "Parking",
  "Gym",
];

const pinInclude = {
  floorPlans: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      amenities: { orderBy: { sortOrder: "asc" as const } },
      photos: { orderBy: { sortOrder: "asc" as const } },
    },
  },
};

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const pins = await prisma.pin.findMany({
    where: { userId: req.userId },
    include: pinInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json(pins);
});

router.post("/", async (req: AuthRequest, res) => {
  const { name, address, latitude, longitude, color } = req.body;

  if (!name || !address || latitude == null || longitude == null) {
    return res.status(400).json({ error: "name, address, latitude, longitude are required" });
  }

  const pin = await prisma.pin.create({
    data: {
      userId: req.userId!,
      name,
      address,
      latitude,
      longitude,
      color: color || "#3b82f6",
      floorPlans: {
        create: {
          name: "New Floor Plan",
          sortOrder: 0,
          amenities: {
            create: DEFAULT_AMENITIES.map((label, i) => ({
              label,
              checked: false,
              sortOrder: i,
            })),
          },
        },
      },
    },
    include: pinInclude,
  });

  res.status(201).json(pin);
});

router.put("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, address, latitude, longitude, color } = req.body;

  const existing = await prisma.pin.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Pin not found" });
  }

  const pin = await prisma.pin.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(color !== undefined && { color }),
    },
    include: pinInclude,
  });

  res.json(pin);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = await prisma.pin.findFirst({
    where: { id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "Pin not found" });
  }

  await prisma.pin.delete({ where: { id } });
  res.status(204).send();
});

export default router;
```

- [ ] **Step 4: Wire pin routes into app.ts**

Add to `server/src/app.ts`:
```typescript
import pinRoutes from "./routes/pins.js";
// ... after existing routes
app.use("/api/pins", pinRoutes);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/pins.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/
git commit -m "feat: add pin CRUD routes with default floor plan creation"
```

---

## Task 5: Floor Plan CRUD Routes

**Files:**
- Create: `server/src/routes/floorPlans.ts`
- Create: `server/src/__tests__/floorPlans.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write floor plan tests**

```typescript
// server/src/__tests__/floorPlans.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;
let pinId: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;

  const pin = await request
    .post("/api/pins")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Test Building",
      address: "123 St",
      latitude: 47.0,
      longitude: -122.0,
    });
  pinId = pin.body.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/pins/:pinId/floor-plans", () => {
  it("creates a floor plan with default amenities", async () => {
    const res = await request
      .post(`/api/pins/${pinId}/floor-plans`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "2BR — Unit 5A", rent: 240000 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("2BR — Unit 5A");
    expect(res.body.rent).toBe(240000);
    expect(res.body.amenities).toHaveLength(6);
  });
});

describe("PUT /api/floor-plans/:id", () => {
  it("updates floor plan fields", async () => {
    const pin = await request
      .get("/api/pins")
      .set("Authorization", `Bearer ${token}`);
    const fpId = pin.body[0].floorPlans[0].id;

    const res = await request
      .put(`/api/floor-plans/${fpId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated", rent: 180000, notes: "Great view" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
    expect(res.body.rent).toBe(180000);
    expect(res.body.notes).toBe("Great view");
  });
});

describe("DELETE /api/floor-plans/:id", () => {
  it("deletes a floor plan and its amenities", async () => {
    const pin = await request
      .get("/api/pins")
      .set("Authorization", `Bearer ${token}`);
    const fpId = pin.body[0].floorPlans[0].id;

    const res = await request
      .delete(`/api/floor-plans/${fpId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/floorPlans.test.ts
```

- [ ] **Step 3: Implement floor plan routes**

```typescript
// server/src/routes/floorPlans.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_AMENITIES = [
  "AC",
  "Heating",
  "Dishwasher",
  "In-unit Laundry",
  "Parking",
  "Gym",
];

router.use(requireAuth);

// Create floor plan under a pin
router.post("/pins/:pinId/floor-plans", async (req: AuthRequest, res) => {
  const { pinId } = req.params;
  const { name, rent, notes } = req.body;

  // Verify pin belongs to user
  const pin = await prisma.pin.findFirst({
    where: { id: pinId, userId: req.userId },
  });
  if (!pin) {
    return res.status(404).json({ error: "Pin not found" });
  }

  const maxOrder = await prisma.floorPlan.aggregate({
    where: { pinId },
    _max: { sortOrder: true },
  });

  const floorPlan = await prisma.floorPlan.create({
    data: {
      pinId,
      name: name || "New Floor Plan",
      rent: rent ?? null,
      notes: notes || "",
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      amenities: {
        create: DEFAULT_AMENITIES.map((label, i) => ({
          label,
          checked: false,
          sortOrder: i,
        })),
      },
    },
    include: {
      amenities: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  res.status(201).json(floorPlan);
});

// Update floor plan
router.put("/floor-plans/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, rent, notes, sortOrder } = req.body;

  // Verify ownership via pin
  const fp = await prisma.floorPlan.findUnique({
    where: { id },
    include: { pin: true },
  });
  if (!fp || fp.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const updated = await prisma.floorPlan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(rent !== undefined && { rent }),
      ...(notes !== undefined && { notes }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
    include: {
      amenities: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  res.json(updated);
});

// Delete floor plan
router.delete("/floor-plans/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const fp = await prisma.floorPlan.findUnique({
    where: { id },
    include: { pin: true },
  });
  if (!fp || fp.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  await prisma.floorPlan.delete({ where: { id } });
  res.status(204).send();
});

export default router;
```

- [ ] **Step 4: Wire floor plan routes into app.ts**

Add to `server/src/app.ts`:
```typescript
import floorPlanRoutes from "./routes/floorPlans.js";
// ...
app.use("/api", floorPlanRoutes);
```

Note: This router handles both `/api/pins/:pinId/floor-plans` and `/api/floor-plans/:id`, so mount at `/api`.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/floorPlans.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/
git commit -m "feat: add floor plan CRUD routes with default amenities"
```

---

## Task 6: Amenity CRUD Routes

**Files:**
- Create: `server/src/routes/amenities.ts`
- Create: `server/src/__tests__/amenities.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Write amenity tests**

```typescript
// server/src/__tests__/amenities.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;
let floorPlanId: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;

  const pin = await request
    .post("/api/pins")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test", address: "123 St", latitude: 47.0, longitude: -122.0 });
  floorPlanId = pin.body.floorPlans[0].id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PUT /api/amenities/:id", () => {
  it("toggles an amenity checked state", async () => {
    const pins = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const amenityId = pins.body[0].floorPlans[0].amenities[0].id;

    const res = await request
      .put(`/api/amenities/${amenityId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checked: true });

    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
  });

  it("updates an amenity label", async () => {
    const pins = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const amenityId = pins.body[0].floorPlans[0].amenities[0].id;

    const res = await request
      .put(`/api/amenities/${amenityId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Central AC" });

    expect(res.status).toBe(200);
    expect(res.body.label).toBe("Central AC");
  });
});

describe("POST /api/floor-plans/:floorPlanId/amenities", () => {
  it("adds a custom amenity", async () => {
    const res = await request
      .post(`/api/floor-plans/${floorPlanId}/amenities`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Balcony" });

    expect(res.status).toBe(201);
    expect(res.body.label).toBe("Balcony");
    expect(res.body.checked).toBe(false);
  });
});

describe("DELETE /api/amenities/:id", () => {
  it("removes an amenity", async () => {
    const pins = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const amenityId = pins.body[0].floorPlans[0].amenities[0].id;

    const res = await request
      .delete(`/api/amenities/${amenityId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/amenities.test.ts
```

- [ ] **Step 3: Implement amenity routes**

```typescript
// server/src/routes/amenities.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.use(requireAuth);

// Add amenity to a floor plan
router.post("/floor-plans/:floorPlanId/amenities", async (req: AuthRequest, res) => {
  const { floorPlanId } = req.params;
  const { label } = req.body;

  if (!label) {
    return res.status(400).json({ error: "label is required" });
  }

  // Verify ownership
  const fp = await prisma.floorPlan.findUnique({
    where: { id: floorPlanId },
    include: { pin: true },
  });
  if (!fp || fp.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const maxOrder = await prisma.amenityItem.aggregate({
    where: { floorPlanId },
    _max: { sortOrder: true },
  });

  const amenity = await prisma.amenityItem.create({
    data: {
      floorPlanId,
      label,
      checked: false,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  res.status(201).json(amenity);
});

// Update amenity
router.put("/amenities/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { checked, label } = req.body;

  const amenity = await prisma.amenityItem.findUnique({
    where: { id },
    include: { floorPlan: { include: { pin: true } } },
  });
  if (!amenity || amenity.floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Amenity not found" });
  }

  const updated = await prisma.amenityItem.update({
    where: { id },
    data: {
      ...(checked !== undefined && { checked }),
      ...(label !== undefined && { label }),
    },
  });

  res.json(updated);
});

// Delete amenity
router.delete("/amenities/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const amenity = await prisma.amenityItem.findUnique({
    where: { id },
    include: { floorPlan: { include: { pin: true } } },
  });
  if (!amenity || amenity.floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Amenity not found" });
  }

  await prisma.amenityItem.delete({ where: { id } });
  res.status(204).send();
});

export default router;
```

- [ ] **Step 4: Wire amenity routes into app.ts**

Add to `server/src/app.ts`:
```typescript
import amenityRoutes from "./routes/amenities.js";
// ...
app.use("/api", amenityRoutes);
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/amenities.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/src/
git commit -m "feat: add amenity CRUD routes (toggle, add, remove)"
```

---

## Task 7: Photo Presigned URL Routes + S3 Service

**Files:**
- Create: `server/src/services/s3.ts`
- Create: `server/src/routes/photos.ts`
- Create: `server/src/__tests__/photos.test.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Implement S3 service**

```typescript
// server/src/services/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || "housing-map-photos";

export async function createPresignedUploadUrl(
  mimeType: string,
  extension: string
): Promise<{ uploadUrl: string; storageKey: string; publicUrl: string }> {
  const key = `photos/${crypto.randomUUID()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  // Public URL for reading (bucket has public read policy)
  const publicUrl = `${process.env.S3_ENDPOINT}/${BUCKET}/${key}`;

  return { uploadUrl, storageKey: key, publicUrl };
}

export async function deleteObject(storageKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
    })
  );
}
```

- [ ] **Step 2: Write photo tests**

```typescript
// server/src/__tests__/photos.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;
let floorPlanId: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;

  const pin = await request
    .post("/api/pins")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test", address: "123 St", latitude: 47.0, longitude: -122.0 });
  floorPlanId = pin.body.floorPlans[0].id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/floor-plans/:floorPlanId/photos/presign", () => {
  it("returns a presigned upload URL and creates a photo record", async () => {
    const res = await request
      .post(`/api/floor-plans/${floorPlanId}/photos/presign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ filename: "kitchen.jpg", mimeType: "image/jpeg" });

    expect(res.status).toBe(201);
    expect(res.body.uploadUrl).toContain("housing-map-photos");
    expect(res.body.photo.originalName).toBe("kitchen.jpg");
    expect(res.body.photo.mimeType).toBe("image/jpeg");
    expect(res.body.photo.storageKey).toMatch(/^photos\//);
  });

  it("rejects unsupported mime types", async () => {
    const res = await request
      .post(`/api/floor-plans/${floorPlanId}/photos/presign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ filename: "doc.pdf", mimeType: "application/pdf" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/photos/:id", () => {
  it("deletes a photo record", async () => {
    const presign = await request
      .post(`/api/floor-plans/${floorPlanId}/photos/presign`)
      .set("Authorization", `Bearer ${token}`)
      .send({ filename: "test.jpg", mimeType: "image/jpeg" });

    const res = await request
      .delete(`/api/photos/${presign.body.photo.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/photos.test.ts
```

- [ ] **Step 4: Implement photo routes**

```typescript
// server/src/routes/photos.ts
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import { createPresignedUploadUrl, deleteObject } from "../services/s3.js";
import path from "path";

const router = Router();
const prisma = new PrismaClient();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

router.use(requireAuth);

// Get presigned upload URL
router.post("/floor-plans/:floorPlanId/photos/presign", async (req: AuthRequest, res) => {
  const { floorPlanId } = req.params;
  const { filename, mimeType } = req.body;

  if (!filename || !mimeType) {
    return res.status(400).json({ error: "filename and mimeType are required" });
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: "Unsupported file type. Use JPEG, PNG, or WebP." });
  }

  // Verify ownership
  const fp = await prisma.floorPlan.findUnique({
    where: { id: floorPlanId },
    include: { pin: true },
  });
  if (!fp || fp.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const extension = path.extname(filename) || `.${mimeType.split("/")[1]}`;
  const { uploadUrl, storageKey, publicUrl } = await createPresignedUploadUrl(mimeType, extension);

  const maxOrder = await prisma.photo.aggregate({
    where: { floorPlanId },
    _max: { sortOrder: true },
  });

  const photo = await prisma.photo.create({
    data: {
      floorPlanId,
      storageKey,
      url: publicUrl,
      mimeType,
      originalName: filename,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  res.status(201).json({ uploadUrl, photo });
});

// Delete photo
router.delete("/photos/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { floorPlan: { include: { pin: true } } },
  });
  if (!photo || photo.floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Photo not found" });
  }

  try {
    await deleteObject(photo.storageKey);
  } catch {
    // Log but don't fail — orphaned S3 objects are better than dangling DB records
    console.warn(`Failed to delete S3 object: ${photo.storageKey}`);
  }

  await prisma.photo.delete({ where: { id } });
  res.status(204).send();
});

export default router;
```

- [ ] **Step 5: Wire photo routes into app.ts**

Add to `server/src/app.ts`:
```typescript
import photoRoutes from "./routes/photos.js";
// ...
app.use("/api", photoRoutes);
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/photos.test.ts
```

Expected: All 3 tests PASS. (Requires MinIO running via docker compose.)

- [ ] **Step 7: Run all server tests**

```bash
npx vitest run
```

Expected: All tests across all files PASS.

- [ ] **Step 8: Commit**

```bash
git add server/src/
git commit -m "feat: add photo presigned URL routes and S3 service"
```

---

## Task 8: Frontend Types + API Client

**Files:**
- Create: `client/src/types/index.ts`
- Create: `client/src/services/api.ts`
- Create: `client/src/services/auth.ts`
- Create: `client/src/services/pins.ts`
- Create: `client/src/services/floorPlans.ts`
- Create: `client/src/services/amenities.ts`
- Create: `client/src/services/photos.ts`

- [ ] **Step 1: Define shared types**

```typescript
// client/src/types/index.ts
export interface User {
  id: string;
  email: string;
}

export interface AmenityItem {
  id: string;
  floorPlanId: string;
  label: string;
  checked: boolean;
  sortOrder: number;
}

export interface Photo {
  id: string;
  floorPlanId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  originalName: string;
  sortOrder: number;
}

export interface FloorPlan {
  id: string;
  pinId: string;
  name: string;
  rent: number | null;
  notes: string;
  sortOrder: number;
  amenities: AmenityItem[];
  photos: Photo[];
}

export interface Pin {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  color: string;
  floorPlans: FloorPlan[];
}
```

- [ ] **Step 2: Create API client with auth header**

```typescript
// client/src/services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3: Create auth service**

```typescript
// client/src/services/auth.ts
import api from "./api";
import type { User } from "../types";

interface AuthResponse {
  token: string;
  user: User;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", { email, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
}
```

- [ ] **Step 4: Create pins service**

```typescript
// client/src/services/pins.ts
import api from "./api";
import type { Pin } from "../types";

export async function fetchPins(): Promise<Pin[]> {
  const res = await api.get<Pin[]>("/pins");
  return res.data;
}

export async function createPin(data: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  color?: string;
}): Promise<Pin> {
  const res = await api.post<Pin>("/pins", data);
  return res.data;
}

export async function updatePin(id: string, data: Partial<{
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  color: string;
}>): Promise<Pin> {
  const res = await api.put<Pin>(`/pins/${id}`, data);
  return res.data;
}

export async function deletePin(id: string): Promise<void> {
  await api.delete(`/pins/${id}`);
}
```

- [ ] **Step 5: Create floor plans service**

```typescript
// client/src/services/floorPlans.ts
import api from "./api";
import type { FloorPlan } from "../types";

export async function createFloorPlan(
  pinId: string,
  data: { name: string; rent?: number; notes?: string }
): Promise<FloorPlan> {
  const res = await api.post<FloorPlan>(`/pins/${pinId}/floor-plans`, data);
  return res.data;
}

export async function updateFloorPlan(
  id: string,
  data: Partial<{ name: string; rent: number; notes: string; sortOrder: number }>
): Promise<FloorPlan> {
  const res = await api.put<FloorPlan>(`/floor-plans/${id}`, data);
  return res.data;
}

export async function deleteFloorPlan(id: string): Promise<void> {
  await api.delete(`/floor-plans/${id}`);
}
```

- [ ] **Step 6: Create amenities service**

```typescript
// client/src/services/amenities.ts
import api from "./api";
import type { AmenityItem } from "../types";

export async function createAmenity(
  floorPlanId: string,
  label: string
): Promise<AmenityItem> {
  const res = await api.post<AmenityItem>(`/floor-plans/${floorPlanId}/amenities`, { label });
  return res.data;
}

export async function updateAmenity(
  id: string,
  data: Partial<{ checked: boolean; label: string }>
): Promise<AmenityItem> {
  const res = await api.put<AmenityItem>(`/amenities/${id}`, data);
  return res.data;
}

export async function deleteAmenity(id: string): Promise<void> {
  await api.delete(`/amenities/${id}`);
}
```

- [ ] **Step 7: Create photos service**

```typescript
// client/src/services/photos.ts
import api from "./api";
import type { Photo } from "../types";

interface PresignResponse {
  uploadUrl: string;
  photo: Photo;
}

export async function presignPhoto(
  floorPlanId: string,
  filename: string,
  mimeType: string
): Promise<PresignResponse> {
  const res = await api.post<PresignResponse>(
    `/floor-plans/${floorPlanId}/photos/presign`,
    { filename, mimeType }
  );
  return res.data;
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File
): Promise<void> {
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
}

export async function deletePhoto(id: string): Promise<void> {
  await api.delete(`/photos/${id}`);
}
```

- [ ] **Step 8: Commit**

```bash
git add client/src/types/ client/src/services/
git commit -m "feat: add frontend TypeScript types and API service layer"
```

---

## Task 9: Auth Context + Login/Register Pages

**Files:**
- Create: `client/src/hooks/useAuth.tsx`
- Create: `client/src/pages/LoginPage.tsx`
- Create: `client/src/pages/RegisterPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create auth context and hook**

```tsx
// client/src/hooks/useAuth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "../types";
import * as authService from "../services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (email: string, password: string) => {
    const res = await authService.register(email, password);
    localStorage.setItem("token", res.token);
    localStorage.setItem("user", JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Create LoginPage**

```tsx
// client/src/pages/LoginPage.tsx
import { useState, FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>Housing Map</h1>
      <h2>Log In</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 24px" }}>Log In</button>
      </form>
      <p style={{ marginTop: 16 }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create RegisterPage**

```tsx
// client/src/pages/RegisterPage.tsx
import { useState, FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(email, password);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h1>Housing Map</h1>
      <h2>Create Account</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 24px" }}>Create Account</button>
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Set up routing in App.tsx**

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function MapPagePlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>Welcome, {user?.email}! Map coming soon.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MapPagePlaceholder />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Verify login/register flow manually**

Start both client and server. Register a new user, get redirected to `/`. Log out, log back in.

- [ ] **Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: add auth context, login page, and register page"
```

---

## Task 10: Map View with Pin Markers

**Files:**
- Create: `client/src/hooks/usePins.ts`
- Create: `client/src/components/MapView.tsx`
- Create: `client/src/pages/MapPage.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create usePins hook**

```typescript
// client/src/hooks/usePins.ts
import { useState, useEffect, useCallback } from "react";
import type { Pin } from "../types";
import * as pinService from "../services/pins";

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pinService.fetchPins();
      setPins(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pins, loading, refresh, setPins };
}
```

- [ ] **Step 2: Create MapView component**

```tsx
// client/src/components/MapView.tsx
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Pin } from "../types";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

interface MapViewProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  onMapClick: (lat: number, lng: number) => void;
  center?: [number, number];
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView({ pins, onPinClick, onMapClick, center }: MapViewProps) {
  const defaultCenter: [number, number] = center || [47.674, -122.121]; // Redmond, WA

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onClick={onMapClick} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.latitude, pin.longitude]}
          eventHandlers={{
            click: () => onPinClick(pin),
          }}
        >
          <Popup>{pin.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

- [ ] **Step 3: Create MapPage (shell)**

```tsx
// client/src/pages/MapPage.tsx
import { useState } from "react";
import { usePins } from "../hooks/usePins";
import MapView from "../components/MapView";
import type { Pin } from "../types";

export default function MapPage() {
  const { pins, loading, refresh } = usePins();
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Will be wired to AddPin flow in a later task
    console.log("Map clicked:", lat, lng);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* TopBar placeholder */}
      <div style={{ padding: "8px 16px", background: "#1e293b", color: "#e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Housing Map</strong>
        <span>Map loaded with {pins.length} pins</span>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <MapView
          pins={pins}
          onPinClick={handlePinClick}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace placeholder in App.tsx**

Replace `MapPagePlaceholder` import/usage with:
```tsx
import MapPage from "./pages/MapPage";
// In the route:
<Route path="/" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
```

- [ ] **Step 5: Verify map renders with OpenStreetMap tiles**

Start both servers. Log in. Confirm Leaflet map loads centered on Redmond, WA.

- [ ] **Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: add interactive map view with pin markers"
```

---

## Task 11: TopBar + Address Search

**Files:**
- Create: `client/src/components/TopBar.tsx`
- Create: `client/src/components/AddressSearch.tsx`
- Modify: `client/src/pages/MapPage.tsx`

- [ ] **Step 1: Create AddressSearch component (Nominatim geocoding)**

```tsx
// client/src/components/AddressSearch.tsx
import { useState, useRef } from "react";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressSearchProps {
  onSelect: (address: string, lat: number, lng: number) => void;
}

export default function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const search = (q: string) => {
    setQuery(q);
    clearTimeout(timeoutRef.current);
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Debounce to respect Nominatim's 1 req/sec policy
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { "User-Agent": "HousingMap/1.0" } }
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    }, 500);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search address..."
        style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", width: 250 }}
      />
      {open && (
        <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1e293b", border: "1px solid #334155", borderRadius: 4, listStyle: "none", padding: 0, margin: "4px 0", zIndex: 1000, maxHeight: 200, overflow: "auto" }}>
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => {
                onSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon));
                setQuery(r.display_name);
                setOpen(false);
              }}
              style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #334155", color: "#e2e8f0", fontSize: 12 }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create TopBar component**

```tsx
// client/src/components/TopBar.tsx
import { useAuth } from "../hooks/useAuth";
import AddressSearch from "./AddressSearch";

interface TopBarProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  onAddPin: () => void;
  onToggleSidebar: () => void;
  pinCount: number;
}

export default function TopBar({ onAddressSelect, onAddPin, onToggleSidebar, pinCount }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "8px 16px", background: "#1e293b", color: "#e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <strong style={{ fontSize: 16 }}>Housing Map</strong>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
        <AddressSearch onSelect={onAddressSelect} />
        <button onClick={onAddPin} style={{ padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
          + Add Pin
        </button>
        <button onClick={onToggleSidebar} style={{ padding: "6px 14px", background: "#0f172a", color: "#94a3b8", border: "1px solid #334155", borderRadius: 4, cursor: "pointer" }}>
          ☰ List ({pinCount})
        </button>
        <div style={{ color: "#64748b", fontSize: 12 }}>
          {user?.email}{" "}
          <button onClick={logout} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", textDecoration: "underline" }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire TopBar into MapPage**

Update `client/src/pages/MapPage.tsx` to replace the placeholder top bar with the `TopBar` component. Pass `onAddressSelect` to fly the map to the geocoded location and start the add-pin flow.

- [ ] **Step 4: Verify address search works**

Type an address like "Redmond, WA" into the search bar. Confirm dropdown appears with Nominatim results. Click a result — map should center on it.

- [ ] **Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: add top bar with address search (Nominatim geocoding)"
```

---

## Task 12: Pin Popup (Read Mode)

**Files:**
- Create: `client/src/components/PinPopup.tsx`
- Create: `client/src/components/FloorPlanTabs.tsx`
- Modify: `client/src/pages/MapPage.tsx`

- [ ] **Step 1: Create FloorPlanTabs component**

```tsx
// client/src/components/FloorPlanTabs.tsx
import type { FloorPlan } from "../types";

interface FloorPlanTabsProps {
  floorPlans: FloorPlan[];
  activeIndex: number;
  onTabClick: (index: number) => void;
  onAddTab?: () => void;
  showAdd?: boolean;
}

export default function FloorPlanTabs({ floorPlans, activeIndex, onTabClick, onAddTab, showAdd }: FloorPlanTabsProps) {
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #334155", overflowX: "auto" }}>
      {floorPlans.map((fp, i) => (
        <button
          key={fp.id}
          onClick={() => onTabClick(i)}
          style={{
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            borderBottom: i === activeIndex ? "2px solid #3b82f6" : "2px solid transparent",
            color: i === activeIndex ? "#3b82f6" : "#64748b",
            fontWeight: i === activeIndex ? 600 : 400,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontSize: 12,
          }}
        >
          {fp.name}{fp.rent ? ` — $${(fp.rent / 100).toLocaleString()}` : ""}
        </button>
      ))}
      {showAdd && (
        <button
          onClick={onAddTab}
          style={{ padding: "6px 8px", background: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 12 }}
        >
          + Add
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create PinPopup component**

```tsx
// client/src/components/PinPopup.tsx
import { useState } from "react";
import type { Pin } from "../types";
import FloorPlanTabs from "./FloorPlanTabs";

interface PinPopupProps {
  pin: Pin;
  onEdit: (pin: Pin) => void;
  onClose: () => void;
}

export default function PinPopup({ pin, onEdit, onClose }: PinPopupProps) {
  const [activeTab, setActiveTab] = useState(0);
  const fp = pin.floorPlans[activeTab];

  return (
    <div style={{ background: "#1e1e36", border: "1px solid #3b82f6", borderRadius: 8, padding: 12, width: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", color: "#e2e8f0", fontSize: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{pin.name}</div>
          <div style={{ color: "#64748b", fontSize: 10 }}>{pin.address}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onEdit(pin)} style={{ color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "none", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
            Edit
          </button>
          <button onClick={onClose} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>
      </div>

      {/* Floor plan tabs */}
      <FloorPlanTabs
        floorPlans={pin.floorPlans}
        activeIndex={activeTab}
        onTabClick={setActiveTab}
      />

      {fp && (
        <div style={{ marginTop: 8 }}>
          {/* Rent */}
          {fp.rent && (
            <div style={{ color: "#f59e0b", fontSize: 13, marginBottom: 6 }}>
              ${(fp.rent / 100).toLocaleString()}/mo
            </div>
          )}

          {/* Notes */}
          {fp.notes && (
            <div style={{ background: "#2d2d44", padding: 8, borderRadius: 4, marginBottom: 6 }}>
              <div style={{ color: "#64748b", fontSize: 9, marginBottom: 2 }}>NOTES</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{fp.notes}</div>
            </div>
          )}

          {/* Photos */}
          {fp.photos.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 6, overflowX: "auto" }}>
              {fp.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.originalName}
                  style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 4, border: "1px solid #475569" }}
                />
              ))}
            </div>
          )}

          {/* Amenities */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {fp.amenities.map((a) => (
              <span
                key={a.id}
                style={{
                  background: a.checked ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                  color: a.checked ? "#10b981" : "#ef4444",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                {a.checked ? "☑" : "☐"} {a.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire PinPopup into MapPage**

Update `MapPage.tsx` to show `PinPopup` as an absolutely positioned overlay when a pin is selected. Position it near the map center or to the side.

- [ ] **Step 4: Verify popup shows on pin click**

Create a pin via the API (or add the "Add Pin" flow). Click the pin marker — popup should appear with building info, tabs, and amenity tags.

- [ ] **Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: add pin popup with floor plan tabs and amenity tags"
```

---

## Task 13: Edit Panel

**Files:**
- Create: `client/src/components/EditPanel.tsx`
- Create: `client/src/components/AmenityChecklist.tsx`
- Create: `client/src/components/PhotoGallery.tsx`
- Modify: `client/src/pages/MapPage.tsx`

- [ ] **Step 1: Create AmenityChecklist component**

```tsx
// client/src/components/AmenityChecklist.tsx
import { useState } from "react";
import type { AmenityItem } from "../types";
import * as amenityService from "../services/amenities";

interface AmenityChecklistProps {
  amenities: AmenityItem[];
  floorPlanId: string;
  onUpdate: () => void; // trigger refresh
}

export default function AmenityChecklist({ amenities, floorPlanId, onUpdate }: AmenityChecklistProps) {
  const [newLabel, setNewLabel] = useState("");

  const toggleAmenity = async (amenity: AmenityItem) => {
    await amenityService.updateAmenity(amenity.id, { checked: !amenity.checked });
    onUpdate();
  };

  const addAmenity = async () => {
    if (!newLabel.trim()) return;
    await amenityService.createAmenity(floorPlanId, newLabel.trim());
    setNewLabel("");
    onUpdate();
  };

  const removeAmenity = async (id: string) => {
    await amenityService.deleteAmenity(id);
    onUpdate();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>Amenities Checklist</span>
      </div>
      <div style={{ background: "#0f172a", padding: 8, borderRadius: 4, border: "1px solid #334155", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {amenities.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: "#1e293b", borderRadius: 4 }}>
            <span
              onClick={() => toggleAmenity(a)}
              style={{ cursor: "pointer", color: a.checked ? "#10b981" : "#ef4444", fontSize: 14 }}
            >
              {a.checked ? "☑" : "☐"}
            </span>
            <span style={{ flex: 1, color: a.checked ? "#e2e8f0" : "#94a3b8", fontSize: 11 }}>{a.label}</span>
            <span
              onClick={() => removeAmenity(a.id)}
              style={{ color: "#475569", cursor: "pointer", fontSize: 10 }}
            >
              ✕
            </span>
          </div>
        ))}
      </div>
      {/* Add new amenity */}
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add amenity..."
          onKeyDown={(e) => e.key === "Enter" && addAmenity()}
          style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 11 }}
        />
        <button onClick={addAmenity} style={{ padding: "4px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>
          + Add
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create PhotoGallery component**

```tsx
// client/src/components/PhotoGallery.tsx
import { useRef } from "react";
import type { Photo } from "../types";
import * as photoService from "../services/photos";

interface PhotoGalleryProps {
  photos: Photo[];
  floorPlanId: string;
  onUpdate: () => void;
}

export default function PhotoGallery({ photos, floorPlanId, onUpdate }: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const { uploadUrl } = await photoService.presignPhoto(floorPlanId, file.name, file.type);
    await photoService.uploadToPresignedUrl(uploadUrl, file);
    onUpdate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    await photoService.deletePhoto(id);
    onUpdate();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase" }}>Photos</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontSize: 10 }}
        >
          📎 Upload
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {photos.map((photo) => (
          <div key={photo.id} style={{ position: "relative" }}>
            <img
              src={photo.url}
              alt={photo.originalName}
              style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 4, border: "1px solid #475569" }}
            />
            <button
              onClick={() => handleDelete(photo.id)}
              style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 14, height: 14, fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
        ))}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 56, height: 42, border: "1px dashed #475569", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", cursor: "pointer", fontSize: 16 }}
        >
          +
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create EditPanel component**

```tsx
// client/src/components/EditPanel.tsx
import { useState } from "react";
import type { Pin, FloorPlan } from "../types";
import FloorPlanTabs from "./FloorPlanTabs";
import AmenityChecklist from "./AmenityChecklist";
import PhotoGallery from "./PhotoGallery";
import * as pinService from "../services/pins";
import * as fpService from "../services/floorPlans";

interface EditPanelProps {
  pin: Pin;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditPanel({ pin, onClose, onUpdate }: EditPanelProps) {
  const [name, setName] = useState(pin.name);
  const [address, setAddress] = useState(pin.address);
  const [activeTab, setActiveTab] = useState(0);
  const [fpName, setFpName] = useState(pin.floorPlans[0]?.name || "");
  const [fpRent, setFpRent] = useState(pin.floorPlans[0]?.rent ? String(pin.floorPlans[0].rent / 100) : "");
  const [fpNotes, setFpNotes] = useState(pin.floorPlans[0]?.notes || "");

  const fp = pin.floorPlans[activeTab];

  const switchTab = (index: number) => {
    setActiveTab(index);
    const target = pin.floorPlans[index];
    if (target) {
      setFpName(target.name);
      setFpRent(target.rent ? String(target.rent / 100) : "");
      setFpNotes(target.notes);
    }
  };

  const handleSave = async () => {
    await pinService.updatePin(pin.id, { name, address });
    if (fp) {
      await fpService.updateFloorPlan(fp.id, {
        name: fpName,
        rent: fpRent ? Math.round(parseFloat(fpRent) * 100) : undefined,
        notes: fpNotes,
      });
    }
    onUpdate();
    onClose();
  };

  const handleAddTab = async () => {
    await fpService.createFloorPlan(pin.id, { name: "New Floor Plan" });
    onUpdate();
  };

  const handleDeleteTab = async () => {
    if (!fp || pin.floorPlans.length <= 1) return;
    await fpService.deleteFloorPlan(fp.id);
    setActiveTab(0);
    onUpdate();
  };

  return (
    <div style={{ width: 340, background: "#1e1e36", borderRadius: 8, padding: 12, border: "1px solid #3b82f6", overflowY: "auto", maxHeight: "100%", color: "#e2e8f0", fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Edit Apartment</span>
        <button onClick={onClose} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>✕ Cancel</button>
      </div>

      {/* Building-level fields */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>Building Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #475569", background: "#2d2d44", color: "#e2e8f0", marginTop: 2 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ display: "block", width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #475569", background: "#2d2d44", color: "#e2e8f0", marginTop: 2 }} />
      </div>

      {/* Floor plan tabs */}
      <FloorPlanTabs
        floorPlans={pin.floorPlans}
        activeIndex={activeTab}
        onTabClick={switchTab}
        onAddTab={handleAddTab}
        showAdd
      />

      {fp && (
        <div style={{ background: "#2d2d44", padding: 10, borderRadius: "0 4px 4px 4px", marginTop: 0 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>Plan Name</label>
              <input value={fpName} onChange={(e) => setFpName(e.target.value)} style={{ display: "block", width: "100%", padding: "5px 6px", borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 2, fontSize: 11 }} />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>Rent ($/mo)</label>
              <input value={fpRent} onChange={(e) => setFpRent(e.target.value)} type="number" style={{ display: "block", width: "100%", padding: "5px 6px", borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#f59e0b", marginTop: 2, fontSize: 11 }} />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: "#64748b", fontSize: 9, textTransform: "uppercase" }}>Notes</label>
            <textarea value={fpNotes} onChange={(e) => setFpNotes(e.target.value)} rows={3} style={{ display: "block", width: "100%", padding: 6, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 2, fontSize: 11, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <PhotoGallery photos={fp.photos} floorPlanId={fp.id} onUpdate={onUpdate} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <AmenityChecklist amenities={fp.amenities} floorPlanId={fp.id} onUpdate={onUpdate} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={handleSave} style={{ flex: 1, padding: 8, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>Save</button>
            {pin.floorPlans.length > 1 && (
              <button onClick={handleDeleteTab} style={{ padding: "8px 14px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", borderRadius: 4, cursor: "pointer" }}>Delete Tab</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire EditPanel into MapPage**

Update `MapPage.tsx`:
- Add `editingPin` state
- When `onEdit` is called from PinPopup, set `editingPin`
- Render EditPanel absolutely positioned on the right side when `editingPin` is set
- Pass `onUpdate={refresh}` to reload pins after edits

- [ ] **Step 5: Verify full edit flow**

Create a pin, click it, click Edit. Change name, add notes, toggle amenities, add a new floor plan tab. Save. Verify changes persist on refresh.

- [ ] **Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: add edit panel with amenity checklist, photo gallery, and floor plan tabs"
```

---

## Task 14: Sidebar (Apartment List)

**Files:**
- Create: `client/src/components/Sidebar.tsx`
- Modify: `client/src/pages/MapPage.tsx`

- [ ] **Step 1: Create Sidebar component**

```tsx
// client/src/components/Sidebar.tsx
import type { Pin } from "../types";

interface SidebarProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  onClose: () => void;
}

export default function Sidebar({ pins, onPinClick, onClose }: SidebarProps) {
  return (
    <div style={{ width: 240, background: "#1e1e36", borderRadius: 8, padding: 10, border: "1px solid #334155", overflowY: "auto", color: "#e2e8f0", fontSize: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>All Apartments ({pins.length})</span>
        <button onClick={onClose} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>✕</button>
      </div>
      {pins.map((pin) => {
        const minRent = Math.min(...pin.floorPlans.filter((fp) => fp.rent).map((fp) => fp.rent!));
        return (
          <div
            key={pin.id}
            onClick={() => onPinClick(pin)}
            style={{ background: "#2d2d44", padding: 8, borderRadius: 6, marginBottom: 6, borderLeft: `3px solid ${pin.color}`, cursor: "pointer" }}
          >
            <div style={{ fontWeight: 600 }}>📍 {pin.name}</div>
            <div style={{ color: "#64748b", fontSize: 10, margin: "2px 0" }}>{pin.address}</div>
            <div style={{ color: "#f59e0b", fontSize: 10 }}>
              {pin.floorPlans.length} plan{pin.floorPlans.length !== 1 ? "s" : ""}
              {isFinite(minRent) ? ` · from $${(minRent / 100).toLocaleString()}/mo` : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 4 }}>
              {pin.floorPlans[0]?.amenities.slice(0, 4).map((a) => (
                <span key={a.id} style={{ background: a.checked ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: a.checked ? "#10b981" : "#ef4444", padding: "1px 5px", borderRadius: 3, fontSize: 8 }}>
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Wire Sidebar into MapPage**

Add `sidebarOpen` state to `MapPage`. Toggle via TopBar's "☰ List" button. Render `Sidebar` next to the map when open. When user clicks a sidebar item, center map on that pin and open its popup.

- [ ] **Step 3: Verify sidebar toggle and pin selection**

Click "☰ List" — sidebar appears. Click an apartment — map centers, popup opens. Click ✕ — sidebar closes.

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add toggleable sidebar with apartment list"
```

---

## Task 15: Add Pin Flow (Search + Map Click)

**Files:**
- Modify: `client/src/pages/MapPage.tsx`
- Modify: `client/src/components/MapView.tsx`

- [ ] **Step 1: Implement add-pin-by-search flow**

In `MapPage.tsx`, when `onAddressSelect` fires from the TopBar search:
1. Call `createPin` with the geocoded address and coordinates
2. Refresh pins
3. Open the edit panel for the new pin

- [ ] **Step 2: Implement add-pin-by-map-click flow**

In `MapPage.tsx`, when `onMapClick` fires:
1. Reverse geocode the coordinates via Nominatim: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
2. Call `createPin` with the reverse-geocoded address (or "Unnamed Location" as fallback) and coordinates
3. Refresh pins
4. Open the edit panel for the new pin

- [ ] **Step 3: Verify both flows**

Search "456 Bellevue Way" — pin appears, edit panel opens. Click an empty map spot — pin appears at that location with reverse-geocoded address.

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add pin creation via address search and map click"
```

---

## Task 16: Delete Pin

**Files:**
- Modify: `client/src/components/EditPanel.tsx`
- Modify: `client/src/pages/MapPage.tsx`

- [ ] **Step 1: Add delete button to EditPanel**

Add a "Delete Pin" button at the bottom of `EditPanel`. On click, confirm with `window.confirm()`, then call `deletePin(pin.id)`, refresh, and close the panel.

- [ ] **Step 2: Verify pin deletion**

Open edit panel, click "Delete Pin", confirm. Pin disappears from map and sidebar.

- [ ] **Step 3: Commit**

```bash
git add client/src/
git commit -m "feat: add pin deletion from edit panel"
```

---

## Task 17: Mobile Responsive Layout

**Files:**
- Create: `client/src/components/BottomSheet.tsx`
- Create: `client/src/components/BottomNav.tsx`
- Modify: `client/src/pages/MapPage.tsx`
- Modify: `client/src/components/TopBar.tsx`

- [ ] **Step 1: Create BottomNav component**

```tsx
// client/src/components/BottomNav.tsx
interface BottomNavProps {
  activeTab: "map" | "list" | "account";
  onTabChange: (tab: "map" | "list" | "account") => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "map" as const, icon: "🗺️", label: "Map" },
    { id: "list" as const, icon: "📋", label: "List" },
    { id: "account" as const, icon: "👤", label: "Account" },
  ];

  return (
    <nav style={{ display: "flex", justifyContent: "space-around", background: "#1e293b", padding: 8, borderTop: "1px solid #334155" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab.id ? "#3b82f6" : "#64748b",
            fontSize: 8, fontWeight: activeTab === tab.id ? 600 : 400,
          }}
        >
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Create BottomSheet component**

```tsx
// client/src/components/BottomSheet.tsx
import { ReactNode } from "react";

interface BottomSheetProps {
  children: ReactNode;
  onClose: () => void;
}

export default function BottomSheet({ children, onClose }: BottomSheetProps) {
  return (
    <div style={{
      position: "absolute", bottom: 56, left: 0, right: 0,
      background: "#1e1e36", borderRadius: "12px 12px 0 0",
      border: "1px solid #334155", borderBottom: "none",
      borderTop: "3px solid #3b82f6",
      padding: 12, maxHeight: "60vh", overflowY: "auto",
      zIndex: 1000,
    }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          onClick={onClose}
          style={{ width: 32, height: 3, background: "#475569", borderRadius: 2, margin: "0 auto", cursor: "pointer" }}
        />
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Add responsive logic to MapPage**

Use a `useMediaQuery` hook or `window.matchMedia("(max-width: 768px)")` to detect mobile. When mobile:
- Hide TopBar's sidebar toggle and search (move search to above the map)
- Show BottomNav instead
- Show BottomSheet instead of popup overlay
- Show full-screen EditPanel instead of side panel
- Show a mobile list view when "List" tab is active
- Show floating "+" action button on the map

- [ ] **Step 4: Add mobile CSS overrides**

Add a `client/src/index.css` with:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; }
```

Import in `main.tsx`.

- [ ] **Step 5: Test responsive behavior**

Use browser DevTools to toggle between desktop and mobile viewports. Verify:
- Desktop: TopBar + map + sidebar + popup overlay
- Mobile: Search + map + FAB + bottom nav + bottom sheet

- [ ] **Step 6: Commit**

```bash
git add client/src/
git commit -m "feat: add mobile responsive layout with bottom sheet and bottom nav"
```

---

## Task 18: Toast Notifications

**Files:**
- Create: `client/src/components/Toast.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create a simple toast component**

```tsx
// client/src/components/Toast.tsx
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: "10px 16px", borderRadius: 6, color: "#fff", fontSize: 13, background: t.type === "error" ? "#ef4444" : "#10b981", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 2: Wrap App with ToastProvider**

In `App.tsx`, wrap the content with `<ToastProvider>`.

- [ ] **Step 3: Add toast calls to key actions**

In `EditPanel`, `MapPage`, and other components, use `useToast()` to show success/error messages after save, delete, upload, etc.

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add toast notification system for user feedback"
```

---

## Task 19: Final Integration Test + Cleanup

**Files:**
- Modify: `client/src/App.tsx` (any final wiring)
- Modify: `.gitignore`

- [ ] **Step 1: Run all server tests**

```bash
cd server && npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: End-to-end manual test**

Full flow test:
1. Register a new account
2. Search for "Avalon Apartments, Redmond WA" → pin created
3. Click map to create a second pin
4. Click pin → popup appears with floor plan tab
5. Click Edit → edit panel opens
6. Change name, add notes, toggle amenities
7. Add a new floor plan tab, fill it in
8. Upload a photo
9. Save, verify changes persist on page refresh
10. Open sidebar, click an apartment → map centers
11. Delete a pin
12. Test on mobile viewport (bottom sheet, bottom nav, full-screen edit)

- [ ] **Step 3: Update .gitignore**

Ensure `.gitignore` includes:
```
.superpowers/
node_modules/
server/.env
client/dist/
server/dist/
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration cleanup and gitignore updates"
```
