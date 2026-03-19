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
    const res = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
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
    const res = await request.post("/api/pins").set("Authorization", `Bearer ${token}`)
      .send({ name: "Avalon Apartments", address: "123 Main St, Redmond, WA", latitude: 47.674, longitude: -122.121 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Avalon Apartments");
    expect(res.body.floorPlans).toHaveLength(1);
    expect(res.body.floorPlans[0].amenities).toHaveLength(6);
  });
});

describe("PUT /api/pins/:id", () => {
  it("updates a pin", async () => {
    const create = await request.post("/api/pins").set("Authorization", `Bearer ${token}`)
      .send({ name: "Old Name", address: "123 Main St", latitude: 47.0, longitude: -122.0 });
    const res = await request.put(`/api/pins/${create.body.id}`).set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });
});

describe("DELETE /api/pins/:id", () => {
  it("deletes a pin and its floor plans", async () => {
    const create = await request.post("/api/pins").set("Authorization", `Bearer ${token}`)
      .send({ name: "To Delete", address: "456 St", latitude: 47.0, longitude: -122.0 });
    const res = await request.delete(`/api/pins/${create.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
    const get = await request.get("/api/pins").set("Authorization", `Bearer ${token}`);
    expect(get.body).toHaveLength(0);
  });
});
