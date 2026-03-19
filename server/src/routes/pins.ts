import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import prisma from "../db.js";

const router = Router();

const DEFAULT_AMENITIES = ["AC", "Heating", "Dishwasher", "In-unit Laundry", "Parking", "Gym"];

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
      name, address, latitude, longitude,
      color: color || "#3b82f6",
      floorPlans: {
        create: {
          name: "New Floor Plan",
          sortOrder: 0,
          amenities: {
            create: DEFAULT_AMENITIES.map((label, i) => ({ label, checked: false, sortOrder: i })),
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
  const existing = await prisma.pin.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Pin not found" });

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
  const existing = await prisma.pin.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Pin not found" });
  await prisma.pin.delete({ where: { id } });
  res.status(204).send();
});

export default router;
