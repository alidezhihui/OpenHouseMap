import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { request, prisma, resetDb, createTestUser } from "./helpers.js";

let token: string;
let floorPlanId: string;

beforeEach(async () => {
  await resetDb();
  const auth = await createTestUser();
  token = auth.token;
  const pin = await request.post("/api/pins").set("Authorization", `Bearer ${token}`)
    .send({ name: "Test", address: "123 St", latitude: 47.0, longitude: -122.0 });
  floorPlanId = pin.body.floorPlans[0].id;
});

afterAll(async () => { await prisma.$disconnect(); });

describe("PUT /api/amenities/:id", () => {
  it("toggles an amenity checked state", async () => {
    const pins = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const amenityId = pins.body[0].floorPlans[0].amenities[0].id;
    const res = await request.put(`/api/amenities/${amenityId}`).set("Authorization", `Bearer ${token}`)
      .send({ checked: true });
    expect(res.status).toBe(200);
    expect(res.body.checked).toBe(true);
  });

  it("updates an amenity label", async () => {
    const pins = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    const amenityId = pins.body[0].floorPlans[0].amenities[0].id;
    const res = await request.put(`/api/amenities/${amenityId}`).set("Authorization", `Bearer ${token}`)
      .send({ label: "Central AC" });
    expect(res.status).toBe(200);
    expect(res.body.label).toBe("Central AC");
  });
});

describe("POST /api/floor-plans/:floorPlanId/amenities", () => {
  it("adds a custom amenity", async () => {
    const res = await request.post(`/api/floor-plans/${floorPlanId}/amenities`).set("Authorization", `Bearer ${token}`)
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
    const res = await request.delete(`/api/amenities/${amenityId}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
