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

describe("POST /api/floor-plans/:floorPlanId/photos/presign", () => {
  it("returns a presigned upload URL and creates a photo record", async () => {
    const res = await request.post(`/api/floor-plans/${floorPlanId}/photos/presign`).set("Authorization", `Bearer ${token}`)
      .send({ filename: "kitchen.jpg", mimeType: "image/jpeg" });
    expect(res.status).toBe(201);
    expect(res.body.uploadUrl).toContain("housing-map-photos");
    expect(res.body.photo.originalName).toBe("kitchen.jpg");
    expect(res.body.photo.mimeType).toBe("image/jpeg");
    expect(res.body.photo.storageKey).toMatch(/^photos\//);
  });

  it("rejects unsupported mime types", async () => {
    const res = await request.post(`/api/floor-plans/${floorPlanId}/photos/presign`).set("Authorization", `Bearer ${token}`)
      .send({ filename: "doc.pdf", mimeType: "application/pdf" });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/photos/:id", () => {
  it("deletes a photo record", async () => {
    const presign = await request.post(`/api/floor-plans/${floorPlanId}/photos/presign`).set("Authorization", `Bearer ${token}`)
      .send({ filename: "test.jpg", mimeType: "image/jpeg" });
    const res = await request.delete(`/api/photos/${presign.body.photo.id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});
