const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL FISH BEHAVIOR LOGS
router.get("/", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        id,
        activity_status,
        behavior_type,
        confidence_score,
        description,
        detected_at
      FROM fish_behavior_logs
      ORDER BY detected_at DESC
    `);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Error fetching fish behavior logs:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch fish behavior logs.",
    });
  }
});

module.exports = router;