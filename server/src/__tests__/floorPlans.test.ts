import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;
let pinId: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;
  const pin = await request.post("/api/pins").set("Authorization", `Bearer ${token}`)
    .send({ name: "Test Building", address: "123 St", latitude: 47.0, longitude: -122.0 });
  pinId = pin.body.id;
});

afterAll(async () => { await prisma.$disconnect(); });

describe("POST /api/pins/:pinId/floor-plans", () => {
  it("creates a floor plan with default amenities", async () => {
    const res = await request.post(`/api/pins/${pinId}/floor-plans`).set("Authorization", `Bearer ${token}`)
      .send({ name: "2BR — Unit 5A", rent: 240000 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("2BR — Unit 5A");
    expect(res.body.rent).toBe(240000);
    expect(res.body.amenities).toHaveLength(6);
  });
});

describe("PUT /api/floor-plans/:id", () => {
  it("updates floor plan fields", async () => {
    const pin = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const fpId = pin.body[0].floorPlans[0].id;
    const res = await request.put(`/api/floor-plans/${fpId}`).set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated", rent: 180000, notes: "Great view" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
    expect(res.body.rent).toBe(180000);
    expect(res.body.notes).toBe("Great view");
  });
});

describe("DELETE /api/floor-plans/:id", () => {
  it("deletes a floor plan and its amenities", async () => {
    const pin = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const fpId = pin.body[0].floorPlans[0].id;
    const res = await request.delete(`/api/floor-plans/${fpId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
