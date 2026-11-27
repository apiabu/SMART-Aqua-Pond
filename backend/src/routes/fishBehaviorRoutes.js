
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ======================================================
// GET ALL FISH BEHAVIOR LOGS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        fbl.id,
        fbl.fish_id,
        fp.fish_name,
        fp.species,
        fbl.activity_status,
        fbl.behavior_type,
        fbl.description,
        fbl.detection_source,
        fbl.detected_at
      FROM fish_behavior_logs AS fbl
      LEFT JOIN fish_profiles AS fp
        ON fbl.fish_id = fp.id
      ORDER BY fbl.detected_at DESC, fbl.id DESC
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

// ======================================================
// POST MANUAL FISH BEHAVIOR OBSERVATION
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      fish_id,
      activity_status,
      behavior_type,
      description,
    } = req.body ?? {};

    // Validate fish ID
    if (
      !Number.isSafeInteger(fish_id) ||
      fish_id <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid fish ID is required.",
      });
    }

    // Validate activity status
    if (
      !["Normal", "Abnormal"].includes(
        activity_status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Activity status must be Normal or Abnormal.",
      });
    }

    // Validate behavior type
    if (
      typeof behavior_type !== "string" ||
      !behavior_type.trim() ||
      behavior_type.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Behavior type must be between 1 and 100 characters.",
      });
    }

    // Validate description
    if (
      description != null &&
      (
        typeof description !== "string" ||
        description.length > 5000
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid observation description.",
      });
    }

    // Verify fish exists
    const [fish] = await pool.query(
      "SELECT id FROM fish_profiles WHERE id = ?",
      [fish_id]
    );

    if (fish.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Fish profile not found.",
      });
    }

    // Save observation
    const [result] = await pool.query(
      `
      INSERT INTO fish_behavior_logs (
        fish_id,
        activity_status,
        behavior_type,
        description,
        detection_source
      )
      VALUES (?, ?, ?, ?, 'Manual')
      `,
      [
        fish_id,
        activity_status,
        behavior_type.trim(),
        description?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Manual fish behavior observation saved successfully.",
      data: {
        id: result.insertId,
        fish_id,
        activity_status,
        behavior_type: behavior_type.trim(),
        detection_source: "Manual",
      },
    });
  } catch (error) {
    console.error(
      "Error saving fish behavior observation:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save fish behavior observation.",
    });
  }
});

module.exports = router;
