import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import prisma from "../db.js";

const router = Router();

const DEFAULT_AMENITIES = ["AC", "Heating", "Dishwasher", "In-unit Laundry", "Parking", "Gym"];

const floorPlanInclude = {
  amenities: { orderBy: { sortOrder: "asc" as const } },
  photos: { orderBy: { sortOrder: "asc" as const } },
};

router.use(requireAuth);

// POST /api/pins/:pinId/floor-plans
router.post("/pins/:pinId/floor-plans", async (req: AuthRequest, res) => {
  const { pinId } = req.params;
  const { name, rent, notes } = req.body;

  const pin = await prisma.pin.findFirst({ where: { id: pinId, userId: req.userId } });
  if (!pin) return res.status(404).json({ error: "Pin not found" });

  const maxSort = await prisma.floorPlan.aggregate({
    where: { pinId },
    _max: { sortOrder: true },
  });
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const floorPlan = await prisma.floorPlan.create({
    data: {
      pinId,
      name: name || "New Floor Plan",
      rent: rent ?? null,
      notes: notes || "",
      sortOrder: nextSort,
      amenities: {
        create: DEFAULT_AMENITIES.map((label, i) => ({ label, checked: false, sortOrder: i })),
      },
    },
    include: floorPlanInclude,
  });

  res.status(201).json(floorPlan);
});

// PUT /api/floor-plans/:id
router.put("/floor-plans/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, rent, notes } = req.body;

  const floorPlan = await prisma.floorPlan.findUnique({ where: { id }, include: { pin: true } });
  if (!floorPlan || floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const updated = await prisma.floorPlan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(rent !== undefined && { rent }),
      ...(notes !== undefined && { notes }),
    },
    include: floorPlanInclude,
  });

  res.json(updated);
});

// DELETE /api/floor-plans/:id
router.delete("/floor-plans/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const floorPlan = await prisma.floorPlan.findUnique({ where: { id }, include: { pin: true } });
  if (!floorPlan || floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  await prisma.floorPlan.delete({ where: { id } });
  res.status(204).send();
});

export default router;
