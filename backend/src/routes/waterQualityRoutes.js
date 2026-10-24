const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET all water quality readings
router.get("/", async (req, res) => {
  try {
    const [readings] = await pool.query(`
      SELECT
        id,
        temperature,
        ph_level,
        dissolved_oxygen,
        turbidity,
        water_level,
        recorded_at
      FROM water_quality_readings
      ORDER BY recorded_at DESC
    `);

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("Error fetching water quality readings:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch water quality readings.",
    });
  }
});

// POST a new water quality reading
router.post("/", async (req, res) => {
  try {
    const {
      temperature,
      ph_level,
      dissolved_oxygen,
      turbidity,
      water_level,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO water_quality_readings
        (temperature, ph_level, dissolved_oxygen, turbidity, water_level)
       VALUES (?, ?, ?, ?, ?)`,
      [
        temperature ?? null,
        ph_level ?? null,
        dissolved_oxygen ?? null,
        turbidity ?? null,
        water_level ?? null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Water quality reading saved successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error saving water quality reading:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to save water quality reading.",
    });
  }
});

module.exports = router;