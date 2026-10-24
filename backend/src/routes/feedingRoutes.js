const express = require("express");
const pool = require("../config/db");

const router = express.Router();

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function normalizeTime(time) {
  if (typeof time !== "string") {
    return null;
  }

  const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

  if (!match) {
    return null;
  }

  return `${match[1]}:${match[2]}:00`;
}

function isValidDays(days) {
  return (
    Array.isArray(days) &&
    days.length > 0 &&
    days.every(
      (day) =>
        typeof day === "string" &&
        validDays.includes(day)
    )
  );
}

// ======================================================
// GET CURRENT FEEDING SCHEDULE
// ======================================================

router.get("/schedule", async (req, res) => {
  try {
    const [schedules] = await pool.query(`
      SELECT
        id,
        feeding_time,
        feeding_days,
        amount,
        enabled,
        created_at,
        updated_at
      FROM feeding_schedules
      WHERE enabled = TRUE
      ORDER BY feeding_time ASC
    `);

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error(
      "Error fetching feeding schedule:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch feeding schedule.",
    });
  }
});

// ======================================================
// SAVE / REPLACE FEEDING SCHEDULE
// ======================================================

router.put("/schedule", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      morningTime,
      afternoonTime,
      days,
    } = req.body;

    const normalizedMorning = normalizeTime(morningTime);
    const normalizedAfternoon = normalizeTime(afternoonTime);

    if (!normalizedMorning || !normalizedAfternoon) {
      return res.status(400).json({
        success: false,
        message:
          "Valid morning and afternoon feeding times are required.",
      });
    }

    if (!isValidDays(days)) {
      return res.status(400).json({
        success: false,
        message:
          "At least one valid feeding day is required.",
      });
    }

    if (normalizedMorning >= normalizedAfternoon) {
      return res.status(400).json({
        success: false,
        message:
          "Afternoon feeding must be later than morning feeding.",
      });
    }

    const orderedDays = validDays.filter((day) =>
      days.includes(day)
    );

    await connection.beginTransaction();

    await connection.execute(`
      DELETE FROM feeding_schedules
    `);

    const [morningResult] = await connection.execute(
      `INSERT INTO feeding_schedules
        (feeding_time, feeding_days, enabled)
       VALUES (?, ?, TRUE)`,
      [
        normalizedMorning,
        JSON.stringify(orderedDays),
      ]
    );

    const [afternoonResult] = await connection.execute(
      `INSERT INTO feeding_schedules
        (feeding_time, feeding_days, enabled)
       VALUES (?, ?, TRUE)`,
      [
        normalizedAfternoon,
        JSON.stringify(orderedDays),
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Feeding schedule saved successfully.",
      data: {
        morningScheduleId: morningResult.insertId,
        afternoonScheduleId: afternoonResult.insertId,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error(
      "Error saving feeding schedule:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to save feeding schedule.",
    });
  } finally {
    connection.release();
  }
});

// ======================================================
// RESET FEEDING SCHEDULE
// ======================================================

router.delete("/schedule", async (req, res) => {
  try {
    const [result] = await pool.execute(`
      DELETE FROM feeding_schedules
    `);

    res.status(200).json({
      success: true,
      message: "Feeding schedule reset successfully.",
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error(
      "Error resetting feeding schedule:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to reset feeding schedule.",
    });
  }
});

// ======================================================
// GET FEEDING HISTORY
// ======================================================

router.get("/history", async (req, res) => {
  try {
    const [history] = await pool.query(`
      SELECT
        id,
        feeding_schedule_id,
        trigger_type,
        status,
        amount,
        fed_at
      FROM feeding_history
      ORDER BY fed_at DESC
    `);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error(
      "Error fetching feeding history:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch feeding history.",
    });
  }
});

module.exports = router;