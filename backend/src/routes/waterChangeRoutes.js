
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ====================================================
// GET CURRENT WATER CHANGE CYCLE
// ====================================================

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         id,
         history_id,
         cycle_status,
         target_percentage,
         trigger_parameter,
         trigger_value,
         started_at,
         completed_at,
         cancelled_at,
         updated_at
       FROM automatic_water_change_state
       WHERE id = 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Water change state not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Water change GET error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve water change state.",
    });
  }
});

// ====================================================
// COMPLETE OR CANCEL A SIMULATED REQUEST
// ====================================================

async function updateCycleStatus(req, res, nextStatus) {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock current cycle to prevent concurrent updates.
    const [rows] = await connection.execute(
      `SELECT
         id,
         history_id,
         cycle_status,
         target_percentage,
         trigger_value
       FROM automatic_water_change_state
       WHERE id = 1
       FOR UPDATE`
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Water change state not found.",
      });
    }

    const currentCycle = rows[0];

    // Only a Requested cycle can change status.
    if (currentCycle.cycle_status !== "Requested") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Only a Requested water change cycle can be completed or cancelled.",
        current_status: currentCycle.cycle_status,
      });
    }

    // A new request must be linked to a history record.
    if (currentCycle.history_id === null) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Active water change cycle has no linked history record.",
      });
    }

    // Verify the linked history record exists and is active.
    const [historyRows] = await connection.execute(
      `SELECT
         id,
         cycle_status
       FROM automatic_water_change_history
       WHERE id = ?
       FOR UPDATE`,
      [currentCycle.history_id]
    );

    if (
      historyRows.length === 0 ||
      historyRows[0].cycle_status !== "Requested"
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Linked water change history record is missing or not Requested.",
      });
    }

    // ==================================================
    // UPDATE CURRENT STATE AND LINKED HISTORY
    // ==================================================

    if (nextStatus === "Completed") {
      // Mark current cycle as completed.
      await connection.execute(
        `UPDATE automatic_water_change_state
         SET
           cycle_status = 'Completed',
           completed_at = CURRENT_TIMESTAMP,
           cancelled_at = NULL
         WHERE id = ?`,
        [currentCycle.id]
      );

      // Mark the corresponding history record as completed.
      await connection.execute(
        `UPDATE automatic_water_change_history
         SET
           cycle_status = 'Completed',
           completed_at = CURRENT_TIMESTAMP,
           cancelled_at = NULL
         WHERE id = ?`,
        [currentCycle.history_id]
      );
    } else {
      // Mark current cycle as cancelled.
      await connection.execute(
        `UPDATE automatic_water_change_state
         SET
           cycle_status = 'Cancelled',
           completed_at = NULL,
           cancelled_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [currentCycle.id]
      );

      // Mark the corresponding history record as cancelled.
      await connection.execute(
        `UPDATE automatic_water_change_history
         SET
           cycle_status = 'Cancelled',
           completed_at = NULL,
           cancelled_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [currentCycle.history_id]
      );
    }

    // ==================================================
    // EQUIPMENT LOGGING - SIMULATION ONLY
    // ==================================================

    const details =
      nextStatus === "Completed"
        ? `Prototype water change cycle marked Completed by API confirmation. ` +
          `Target: ${currentCycle.target_percentage}%. ` +
          `No physical water replacement was verified.`
        : `Prototype water change request cancelled. ` +
          `Original target: ${currentCycle.target_percentage}%. ` +
          `No physical pump or valve command was sent.`;

    const [logResult] = await connection.execute(
      `INSERT INTO equipment_logs
       (
         equipment_name,
         action,
         control_mode,
         status,
         details
       )
       VALUES (?, ?, 'Manual', 'Success', ?)`,
      [
        "Water Change System",
        nextStatus === "Completed"
          ? "COMPLETE"
          : "CANCEL",
        details,
      ]
    );

    // Save current state, history, and equipment log together.
    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        `Prototype water change cycle marked ${nextStatus}.`,
      cycle_status: nextStatus,
      history_id: currentCycle.history_id,
      target_percentage: Number(
        currentCycle.target_percentage
      ),
      log_id: logResult.insertId,
      simulation_only: true,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Water change rollback error:",
          rollbackError
        );
      }
    }

    console.error("Water change update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update water change cycle.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// ====================================================
// PATCH /api/water-change/complete
// ====================================================

router.patch("/complete", async (req, res) => {
  return updateCycleStatus(req, res, "Completed");
});

// ====================================================
// PATCH /api/water-change/cancel
// ====================================================

router.patch("/cancel", async (req, res) => {
  return updateCycleStatus(req, res, "Cancelled");
});


 // ====================================================
 // STEP 45.15.4 - GET WATER-CHANGE HISTORY
 // ====================================================

 router.get("/history", async (req, res) => {
   try {
     const [rows] = await pool.execute(
       `SELECT
          id,
          cycle_status,
          target_percentage,
          trigger_parameter,
          trigger_value,
          started_at,
          completed_at,
          cancelled_at,
          created_at,
          updated_at
        FROM automatic_water_change_history
        ORDER BY id DESC`
     );

     return res.status(200).json({
       success: true,
       count: rows.length,
       data: rows,
     });
   } catch (error) {
     console.error(
       "Water change history GET error:",
       error
     );

     return res.status(500).json({
       success: false,
       message:
         "Failed to retrieve water change history.",
     });
   }
 });

 // ====================================================
 // END OF WATER-CHANGE HISTORY ENDPOINT
 // ====================================================


module.exports = router;
