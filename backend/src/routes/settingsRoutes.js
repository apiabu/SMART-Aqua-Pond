const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET CURRENT SYSTEM SETTINGS
router.get("/", async (req, res) => {
  try {
    const [settings] = await pool.query(`
      SELECT
        id,
        temperature_min,
        temperature_max,
        ph_min,
        ph_max,
        tds_max_ppm,
        turbidity_max,
        water_level_min,
        critical_alerts_enabled,
        warning_alerts_enabled,
        equipment_alerts_enabled,
        fish_behavior_alerts_enabled,
        auto_aeration_enabled,
        auto_water_change_enabled,
        updated_at
      FROM system_settings
      ORDER BY id ASC
      LIMIT 1
    `);

    res.status(200).json({
      success: true,
      data: settings.length > 0 ? settings[0] : null,
    });
  } catch (error) {
    console.error(
      "Error fetching system settings:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch system settings.",
    });
  }
});

// UPDATE CURRENT SYSTEM SETTINGS
router.put("/", async (req, res) => {
  try {
    const {
      temperature_min,
      temperature_max,
      ph_min,
      ph_max,
      tds_max_ppm,
      turbidity_max,
      water_level_min,
      critical_alerts_enabled,
      warning_alerts_enabled,
      equipment_alerts_enabled,
      fish_behavior_alerts_enabled,
      auto_aeration_enabled,
      auto_water_change_enabled,
    } = req.body;

    const numericValues = [
      temperature_min,
      temperature_max,
      ph_min,
      ph_max,
      turbidity_max,
      water_level_min,
    ];

    if (
      numericValues.some(
        (value) =>
          value === undefined ||
          value === null ||
          !Number.isFinite(Number(value))
      ) ||
      tds_max_ppm === undefined ||
      (tds_max_ppm !== null &&
        (!Number.isFinite(Number(tds_max_ppm)) ||
          Number(tds_max_ppm) < 0 ||
          Number(tds_max_ppm) > 100000))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Water-quality thresholds must be valid numbers; the TDS limit may be null or between 0 and 100000 ppm.",
      });
    }

    if (Number(temperature_min) >= Number(temperature_max)) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum temperature must be lower than maximum temperature.",
      });
    }

    if (Number(ph_min) >= Number(ph_max)) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum pH must be lower than maximum pH.",
      });
    }

    const booleanValues = [
      critical_alerts_enabled,
      warning_alerts_enabled,
      equipment_alerts_enabled,
      fish_behavior_alerts_enabled,
      auto_aeration_enabled,
      auto_water_change_enabled,
    ];

    if (
      booleanValues.some(
        (value) => typeof value !== "boolean"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid settings toggle value.",
      });
    }

    if (auto_aeration_enabled) {
      return res.status(400).json({
        success: false,
        message:
          "Automatic aeration requires a dissolved oxygen sensor; TDS cannot be used to control it.",
      });
    }

    const [settings] = await pool.query(`
      SELECT id
      FROM system_settings
      ORDER BY id ASC
      LIMIT 1
    `);

    if (settings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "System settings record not found.",
      });
    }

    const settingsId = settings[0].id;

    await pool.execute(
      `UPDATE system_settings
       SET
         temperature_min = ?,
         temperature_max = ?,
         ph_min = ?,
         ph_max = ?,
         tds_max_ppm = ?,
         turbidity_max = ?,
         water_level_min = ?,
         critical_alerts_enabled = ?,
         warning_alerts_enabled = ?,
         equipment_alerts_enabled = ?,
         fish_behavior_alerts_enabled = ?,
         auto_aeration_enabled = ?,
         auto_water_change_enabled = ?
       WHERE id = ?`,
      [
        Number(temperature_min),
        Number(temperature_max),
        Number(ph_min),
        Number(ph_max),
        tds_max_ppm === null
          ? null
          : Number(tds_max_ppm),
        Number(turbidity_max),
        Number(water_level_min),
        critical_alerts_enabled,
        warning_alerts_enabled,
        equipment_alerts_enabled,
        fish_behavior_alerts_enabled,
        auto_aeration_enabled,
        auto_water_change_enabled,
        settingsId,
      ]
    );

    res.status(200).json({
      success: true,
      message: "System settings updated successfully.",
    });
  } catch (error) {
    console.error(
      "Error updating system settings:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update system settings.",
    });
  }
});
module.exports = router;