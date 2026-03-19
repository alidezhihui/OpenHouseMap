import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import pinRoutes from "./routes/pins.js";
import floorPlanRoutes from "./routes/floorPlans.js";
import amenityRoutes from "./routes/amenities.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", floorPlanRoutes);
app.use("/api", amenityRoutes);
app.use("/api/pins", pinRoutes);

export default app;
