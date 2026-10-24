const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const waterQualityRoutes = require("./routes/waterQualityRoutes");
const alertRoutes = require("./routes/alertRoutes");
const feedingRoutes = require("./routes/feedingRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const fishBehaviorRoutes = require("./routes/fishBehaviorRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "SMART Aqua Pond API is running",
  });
});

// API routes
app.use("/api/water-quality", waterQualityRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/feeding", feedingRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/fish-behavior", fishBehaviorRoutes);
// Start server
app.listen(PORT, () => {
  console.log(
    `SMART Aqua Pond API running on http://localhost:${PORT}`
  );
});