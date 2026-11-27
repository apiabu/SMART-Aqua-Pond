
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ======================================================
// GET ALL FISH APPEARANCE LOGS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        fal.id,
        fal.fish_id,
        fp.fish_name,
        fp.species,
        fal.appearance_status,
        fal.abnormality_type,
        fal.description,
        fal.detection_source,
        fal.detected_at
      FROM fish_appearance_logs AS fal
      LEFT JOIN fish_profiles AS fp
        ON fal.fish_id = fp.id
      ORDER BY fal.detected_at DESC, fal.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Error fetching fish appearance logs:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch fish appearance logs.",
    });
  }
});

// ======================================================
// POST MANUAL FISH APPEARANCE OBSERVATION
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      fish_id,
      appearance_status,
      abnormality_type,
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

    // Validate appearance status
    if (
      !["Normal", "Possible Abnormality"].includes(
        appearance_status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Appearance status must be Normal or Possible Abnormality.",
      });
    }

    // Validate abnormality type
    if (
      abnormality_type != null &&
      (
        typeof abnormality_type !== "string" ||
        abnormality_type.length > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid abnormality type.",
      });
    }

    if (
      appearance_status === "Possible Abnormality" &&
      (
        typeof abnormality_type !== "string" ||
        !abnormality_type.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please specify the visible abnormality.",
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

    // Save manual appearance observation
    const [result] = await pool.query(
      `
      INSERT INTO fish_appearance_logs (
        fish_id,
        appearance_status,
        abnormality_type,
        description,
        detection_source
      )
      VALUES (?, ?, ?, ?, 'Manual')
      `,
      [
        fish_id,
        appearance_status,
        abnormality_type?.trim() || null,
        description?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Manual fish appearance observation saved successfully.",
      data: {
        id: result.insertId,
        fish_id,
        appearance_status,
        abnormality_type:
          abnormality_type?.trim() || null,
        detection_source: "Manual",
      },
    });
  } catch (error) {
    console.error(
      "Error saving fish appearance observation:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save fish appearance observation.",
    });
  }
});

module.exports = router;
