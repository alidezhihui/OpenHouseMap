import { Router } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import prisma from "../db.js";

const router = Router();

router.use(requireAuth);

// POST /api/floor-plans/:floorPlanId/amenities
router.post("/floor-plans/:floorPlanId/amenities", async (req: AuthRequest, res) => {
  const { floorPlanId } = req.params;
  const { label } = req.body;

  if (!label) return res.status(400).json({ error: "label is required" });

  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id: floorPlanId },
    include: { pin: true },
  });
  if (!floorPlan || floorPlan.pin.userId !== req.userId) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const maxSort = await prisma.amenityItem.aggregate({
    where: { floorPlanId },
    _max: { sortOrder: true },
  });
  const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const amenity = await prisma.amenityItem.create({
    data: {
      floorPlanId,
      label,
      checked: false,
      sortOrder: nextSort,
    },
  });

  res.status(201).json(amenity);
});

// PUT /api/amenities/:id
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

// DELETE /api/amenities/:id
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
