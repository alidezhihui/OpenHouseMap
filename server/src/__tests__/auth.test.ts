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
    await request.post("/api/auth/register").send({ email: "dup@test.com", password: "password123" });
    const res = await request.post("/api/auth/register").send({ email: "dup@test.com", password: "password123" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it("rejects missing fields", async () => {
    const res = await request.post("/api/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request.post("/api/auth/register").send({ email: "login@test.com", password: "password123" });
  });

  it("returns a token for valid credentials", async () => {
    const res = await request.post("/api/auth/login").send({ email: "login@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe("login@test.com");
  });

  it("rejects wrong password", async () => {
    const res = await request.post("/api/auth/login").send({ email: "login@test.com", password: "wrong" });
    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await request.post("/api/auth/login").send({ email: "nobody@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});
