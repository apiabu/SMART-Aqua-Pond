
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL REGISTERED FISH
router.get("/", async (req, res) => {
  try {
    const [fish] = await pool.query(`
      SELECT
        id,
        fish_name,
        species,
        description,
        created_at
      FROM fish_profiles
      ORDER BY id ASC
    `);

    res.status(200).json({
      success: true,
      count: fish.length,
      data: fish,
    });
  } catch (error) {
    console.error(
      "Error fetching fish profiles:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch fish profiles.",
    });
  }
});

module.exports = router;
