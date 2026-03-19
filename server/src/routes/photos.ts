import { Router } from "express";
import path from "path";
import { AuthRequest, requireAuth } from "../middleware/auth.js";
import prisma from "../db.js";
import { createPresignedUploadUrl, deleteObject } from "../services/s3.js";

const router = Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

router.use(requireAuth);

// POST /floor-plans/:floorPlanId/photos/presign
router.post("/floor-plans/:floorPlanId/photos/presign", async (req: AuthRequest, res) => {
  const { floorPlanId } = req.params;
  const { filename, mimeType } = req.body;

  if (!filename || !mimeType) {
    return res.status(400).json({ error: "filename and mimeType are required" });
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: `Unsupported mime type. Allowed: ${ALLOWED_TYPES.join(", ")}` });
  }

  // Verify ownership: floorPlan -> pin -> user
  const floorPlan = await prisma.floorPlan.findFirst({
    where: { id: floorPlanId, pin: { userId: req.userId } },
  });

  if (!floorPlan) {
    return res.status(404).json({ error: "Floor plan not found" });
  }

  const extension = path.extname(filename) || `.${mimeType.split("/")[1]}`;
  const { uploadUrl, storageKey, publicUrl } = await createPresignedUploadUrl(mimeType, extension);

  const maxSort = await prisma.photo.aggregate({
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
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  res.status(201).json({ uploadUrl, photo });
});

// DELETE /photos/:id
router.delete("/photos/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;

  const photo = await prisma.photo.findFirst({
    where: { id, floorPlan: { pin: { userId: req.userId } } },
  });

  if (!photo) {
    return res.status(404).json({ error: "Photo not found" });
  }

  // Try to delete from S3, but don't fail if it errors
  try {
    await deleteObject(photo.storageKey);
  } catch (err) {
    console.warn("Failed to delete object from S3:", err);
  }

  await prisma.photo.delete({ where: { id } });
  res.status(204).send();
});

export default router;
