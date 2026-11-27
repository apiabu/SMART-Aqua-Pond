
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const waterQualityRoutes = require("./routes/waterQualityRoutes");
const waterChangeRoutes = require("./routes/waterChangeRoutes");
const alertRoutes = require("./routes/alertRoutes");
const feedingRoutes = require("./routes/feedingRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const fishBehaviorRoutes = require("./routes/fishBehaviorRoutes");
const fishAppearanceRoutes = require("./routes/fishAppearanceRoutes");
const fishProfileRoutes = require("./routes/fishProfileRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ====================================================
// MIDDLEWARE
// ====================================================

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

// ====================================================
// TEST ROUTE
// ====================================================

app.get("/", (req, res) => {
  res.json({
    message: "SMART Aqua Pond API is running",
  });
});

// ====================================================
// API ROUTES
// ====================================================

// Water Quality Monitoring
app.use("/api/water-quality", waterQualityRoutes);

// Automatic Partial Water Change
app.use("/api/water-change", waterChangeRoutes);

// Alerts
app.use("/api/alerts", alertRoutes);

// Feeding
app.use("/api/feeding", feedingRoutes);

// Equipment Control
app.use("/api/equipment", equipmentRoutes);

// System Settings
app.use("/api/settings", settingsRoutes);

// Fish Monitoring
app.use("/api/fish-behavior", fishBehaviorRoutes);
app.use("/api/fish-appearance", fishAppearanceRoutes);
app.use("/api/fish-profiles", fishProfileRoutes);

// ====================================================
// START SERVER
// ====================================================

app.listen(PORT, () => {
  console.log(
    `SMART Aqua Pond API running on http://localhost:${PORT}`
  );
});
