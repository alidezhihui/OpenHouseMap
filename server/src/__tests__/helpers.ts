import "dotenv/config";
import prisma from "../db.js";
import app from "../app.js";
import supertest from "supertest";

export { prisma };
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
