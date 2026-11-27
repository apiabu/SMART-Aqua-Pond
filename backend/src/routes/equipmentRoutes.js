const express = require("express");
const pool = require("../config/db");

const router = express.Router();

const validEquipment = [
  "Aeration System",
  "Water Pump",
  "Automatic Fish Feeder",
];

const validActions = ["ON", "OFF"];

// GET ALL EQUIPMENT LOGS
router.get("/logs", async (req, res) => {
  try {
    const [logs] = await pool.query(`
      SELECT
        id,
        equipment_name,
        action,
        control_mode,
        status,
        details,
        recorded_at
      FROM equipment_logs
      ORDER BY recorded_at DESC
    `);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error(
      "Error fetching equipment logs:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch equipment logs.",
    });
  }
});

// SAVE A SIMULATED EQUIPMENT ACTION
router.post("/logs", async (req, res) => {
  try {
    const {
      equipment_name,
      action,
      details,
    } = req.body;

    if (
      !equipment_name ||
      !action
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Equipment name and action are required.",
      });
    }

    if (!validEquipment.includes(equipment_name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment name.",
      });
    }

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ON or OFF.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO equipment_logs
        (
          equipment_name,
          action,
          control_mode,
          status,
          details
        )
       VALUES (?, ?, ?, ?, ?)`,
      [
        equipment_name,
        action,
        "Manual",
        "Success",
        details ??
          "Prototype control action. No physical hardware command was sent.",
      ]
    );

    res.status(201).json({
      success: true,
      message:
        "Equipment action logged successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error(
      "Error saving equipment log:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to save equipment log.",
    });
  }
});

// ====================================================
// GET AUTOMATIC AERATION STATE - PROTOTYPE
// ====================================================

router.get("/automatic-aeration", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         id,
         equipment_name,
         requested_state,
         last_reading_value
       FROM automatic_aeration_state
       WHERE equipment_name = ?
       LIMIT 1`,
      ["Aeration System"]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Automatic aeration state not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
      simulation_only: true,
    });
  } catch (error) {
    console.error(
      "Automatic aeration state GET error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve automatic aeration state.",
    });
  }
});

module.exports = router;