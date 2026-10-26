const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET all alerts
router.get("/", async (req, res) => {
  try {
    const [alerts] = await pool.query(`
      SELECT
        id,
        title,
        message,
        severity,
        category,
        acknowledged,
        created_at
      FROM alerts
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts.",
    });
  }
});

// POST a new alert
router.post("/", async (req, res) => {
  try {
    const { title, message, severity, category } = req.body;

if (
  typeof title !== "string" ||
  typeof message !== "string" ||
  typeof severity !== "string" ||
  typeof category !== "string" ||
  !title.trim() ||
  !message.trim() ||
  !severity.trim() ||
  !category.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "Title, message, severity, and category must be non-empty text.",
  });
}

    const validSeverities = ["Critical", "Warning", "Info"];

    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert severity.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO alerts
        (title, message, severity, category)
       VALUES (?, ?, ?, ?)`,
      [title, message, severity, category]
    );

    res.status(201).json({
      success: true,
      message: "Alert saved successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error saving alert:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save alert.",
    });
  }
});

// PATCH one alert as acknowledged
router.patch("/:id/acknowledge", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE alerts
       SET acknowledged = TRUE
       WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Alert not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Alert acknowledged successfully.",
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert.",
    });
  }
});

// PATCH all alerts as acknowledged
router.patch("/acknowledge-all", async (req, res) => {
  try {
    const [result] = await pool.execute(`
      UPDATE alerts
      SET acknowledged = TRUE
      WHERE acknowledged = FALSE
    `);

    res.status(200).json({
      success: true,
      message: "All alerts acknowledged successfully.",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error(
      "Error acknowledging all alerts:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to acknowledge all alerts.",
    });
  }
});

module.exports = router;