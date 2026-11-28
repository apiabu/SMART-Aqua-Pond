
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ====================================================
// WATER QUALITY PARAMETERS
// ====================================================

const PARAMETERS = [
  {
    key: "temperature",
    label: "Water Temperature",
    unit: "°C",
    minSetting: "temperature_min",
    maxSetting: "temperature_max",
  },
  {
    key: "ph_level",
    label: "pH Level",
    unit: "pH",
    minSetting: "ph_min",
    maxSetting: "ph_max",
  },
  {
    key: "tds_ppm",
    label: "TDS",
    unit: "ppm",
    maxSetting: "tds_max_ppm",
  },
  {
    key: "turbidity",
    label: "Turbidity",
    unit: "NTU",
    maxSetting: "turbidity_max",
  },
  {
    key: "water_level",
    label: "Water Level",
    unit: "%",
    minSetting: "water_level_min",
  },
];

const PARAMETER_KEYS = PARAMETERS.map(
  (parameter) => parameter.key
);

// ====================================================
// INPUT VALIDATION
// ====================================================

function parseReading(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    throw new Error("INVALID_READING");
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    throw new Error("INVALID_READING");
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error("INVALID_READING");
  }

  return number;
}

function validatePhysicalRange(key, value) {
  if (value === null) {
    return true;
  }

  switch (key) {
    case "temperature":
      return value >= -50 && value <= 100;

    case "ph_level":
      return value >= 0 && value <= 14;

    case "tds_ppm":
      return value >= 0 && value <= 100000;

    case "turbidity":
      return value >= 0 && value <= 100000;

    case "water_level":
      return value >= 0 && value <= 100;

    default:
      return false;
  }
}

// ====================================================
// WATER QUALITY THRESHOLD HELPERS
// ====================================================

function isOutsideThreshold(value, parameter, settings) {
  const min =
    parameter.minSetting !== undefined
      ? Number(settings[parameter.minSetting])
      : null;

  const max =
    parameter.maxSetting !== undefined &&
    settings[parameter.maxSetting] !== null
      ? Number(settings[parameter.maxSetting])
      : null;

  if (min !== null && value < min) {
    return true;
  }

  if (max !== null && value > max) {
    return true;
  }

  return false;
}

function describeThreshold(parameter, settings) {
  const min =
    parameter.minSetting !== undefined
      ? Number(settings[parameter.minSetting])
      : null;

  const max =
    parameter.maxSetting !== undefined &&
    settings[parameter.maxSetting] !== null
      ? Number(settings[parameter.maxSetting])
      : null;

  if (min !== null && max !== null) {
    return `${min}–${max} ${parameter.unit}`;
  }

  if (min !== null) {
    return `minimum ${min} ${parameter.unit}`;
  }

  if (max !== null) {
    return `maximum ${max} ${parameter.unit}`;
  }

  return "not configured";
}

// ====================================================
// AUTOMATIC AERATION - DISABLED WITHOUT DO SENSOR
// ====================================================

function getAutomaticAerationStatus() {
  return {
    enabled: false,
    evaluated: false,
    action: null,
    requested_state: null,
    reason:
      "Automatic aeration requires a dissolved oxygen sensor; TDS cannot determine oxygen levels.",
    log_id: null,
  };
}

// ====================================================
// AUTOMATIC PARTIAL WATER CHANGE - PROTOTYPE
// ====================================================

// Percentage is based on turbidity above the saved maximum.
// Example when turbidity_max = 5 NTU:
// >5 to 10 = 10%
// >10 to 15 = 15%
// >15 to 20 = 20%
// >20 = 25%

function calculateWaterChangePercentage(
  turbidity,
  maximumTurbidity
) {
  const excess = turbidity - maximumTurbidity;

  if (excess <= 0) {
    return null;
  }

  if (excess <= 5) {
    return 10;
  }

  if (excess <= 10) {
    return 15;
  }

  if (excess <= 15) {
    return 20;
  }

  return 25;
}

async function evaluateAutomaticWaterChange(
  connection,
  turbidity,
  waterLevel,
  settings
) {
  const result = {
    enabled:
      Number(settings.auto_water_change_enabled) === 1,
    evaluated: false,
    action: null,
    cycle_status: null,
    target_percentage: null,
    reason: null,
    log_id: null,
  };

  if (!result.enabled) {
    result.reason =
      "Automatic water change is disabled in Settings.";
    return result;
  }

  if (turbidity === null || waterLevel === null) {
    result.reason =
      "Turbidity and water level readings are required.";
    return result;
  }

  const maximumTurbidity = Number(settings.turbidity_max);
  const minimumWaterLevel = Number(settings.water_level_min);

  if (
    !Number.isFinite(maximumTurbidity) ||
    !Number.isFinite(minimumWaterLevel)
  ) {
    throw new Error(
      "Invalid automatic water change thresholds."
    );
  }

  // Lock the existing cycle state record.
  const [stateRows] = await connection.execute(
    `SELECT
       id,
       cycle_status,
       target_percentage
     FROM automatic_water_change_state
     ORDER BY id ASC
     LIMIT 1
     FOR UPDATE`
  );

  if (stateRows.length === 0) {
    throw new Error(
      "Automatic water change state not found."
    );
  }

  const state = stateRows[0];

  result.evaluated = true;
  result.cycle_status = state.cycle_status;
  result.target_percentage =
    state.target_percentage === null
      ? null
      : Number(state.target_percentage);

  // Do not create duplicate or overlapping requests.
  if (state.cycle_status === "Requested") {
    result.reason =
      "A partial water change request already exists.";
    return result;
  }

  // Block requests when the water level is too low.
  if (waterLevel < minimumWaterLevel) {
    result.reason =
      `Water level ${waterLevel}% is below the ` +
      `configured minimum ${minimumWaterLevel}%. ` +
      `Water change request blocked.`;

    return result;
  }

  const percentage = calculateWaterChangePercentage(
    turbidity,
    maximumTurbidity
  );

  if (percentage === null) {
    result.reason =
      "Turbidity is within the configured safe threshold.";
    return result;
  }

  // ==================================================
  // WATER-LEVEL SAFETY VALIDATION
  // ==================================================
  //
  // Prototype assumption:
  // The target percentage represents the percentage
  // of current water volume that would be drained.
  //
  // No hardware commands are sent by this function.
  // ==================================================

  const estimatedWaterLevelAfterDrain =
    waterLevel * (1 - percentage / 100);

  if (estimatedWaterLevelAfterDrain < minimumWaterLevel) {
    result.reason =
      `Water change request blocked for safety. ` +
      `Current water level: ${waterLevel}%. ` +
      `Requested water change: ${percentage}%. ` +
      `Estimated level after draining: ` +
      `${estimatedWaterLevelAfterDrain.toFixed(2)}%. ` +
      `Minimum allowed level: ${minimumWaterLevel}%.`;

    return result;
  }

  const details =
    `Prototype automatic partial water change request: ` +
    `${percentage}%. Turbidity ${turbidity} NTU exceeds ` +
    `the configured maximum ${maximumTurbidity} NTU. ` +
    `Water level: ${waterLevel}%. ` +
    `Estimated level after draining: ` +
    `${estimatedWaterLevelAfterDrain.toFixed(2)}%. ` +
    `Simulation only; no physical pump or valve was activated.`;

  // Save a simulated equipment request.
  // This is NOT a real pump activation.
  const [logResult] = await connection.execute(
    `INSERT INTO equipment_logs
     (
       equipment_name,
       action,
       control_mode,
       status,
       details
     )
     VALUES (?, 'ON', 'Automatic', 'Success', ?)`,
    ["Water Pump", details]
  );

  // ==================================================
  // STEP 45.15.3.3 - SAVE WATER-CHANGE HISTORY
  // ==================================================
  //
  // Create a permanent history record.
  // Link the current cycle to the history ID.
  //
  // Both queries run inside the existing transaction.
  // ==================================================

  const [historyResult] = await connection.execute(
    `INSERT INTO automatic_water_change_history
     (
       cycle_status,
       target_percentage,
       trigger_parameter,
       trigger_value,
       started_at,
       completed_at,
       cancelled_at
     )
     VALUES (
       'Requested',
       ?,
       'turbidity',
       ?,
       CURRENT_TIMESTAMP,
       NULL,
       NULL
     )`,
    [
      percentage,
      turbidity,
    ]
  );

  // Update current cycle and reset old timestamps.
  await connection.execute(
    `UPDATE automatic_water_change_state
     SET
       history_id = ?,
       cycle_status = 'Requested',
       target_percentage = ?,
       trigger_parameter = 'turbidity',
       trigger_value = ?,
       started_at = CURRENT_TIMESTAMP,
       completed_at = NULL,
       cancelled_at = NULL
     WHERE id = ?`,
    [
      historyResult.insertId,
      percentage,
      turbidity,
      state.id,
    ]
  );

  // ==================================================
  // END OF WATER-CHANGE HISTORY SAVE
  // ==================================================

  result.action = "REQUESTED";
  result.cycle_status = "Requested";
  result.target_percentage = percentage;
  result.reason = details;
  result.log_id = logResult.insertId;

  return result;
}

// ====================================================
// GET ALL WATER QUALITY READINGS
// ====================================================

router.get("/", async (req, res) => {
  try {
    const [readings] = await pool.query(`
      SELECT
        id,
        temperature,
        ph_level,
        tds_ppm,
        turbidity,
        water_level,
        recorded_at
      FROM water_quality_readings
      ORDER BY recorded_at DESC, id DESC
    `);

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error(
      "Error fetching water quality readings:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch water quality readings.",
    });
  }
});

// ====================================================
// POST WATER QUALITY READING
// ALERTS + DISABLED AERATION STATUS + PARTIAL WATER CHANGE
// ====================================================

router.post("/", async (req, res) => {
  const body = req.body;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid JSON object is required.",
    });
  }

  const readings = {};

  try {
    for (const key of PARAMETER_KEYS) {
      const value = parseReading(body[key]);

      if (!validatePhysicalRange(key, value)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid physical range for ${key}.`,
        });
      }

      readings[key] = value;
    }
  } catch {
    return res.status(400).json({
      success: false,
      message:
        "Water quality values must be valid numbers or null.",
    });
  }

  if (
    PARAMETER_KEYS.every(
      (key) => readings[key] === null
    )
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one water quality parameter is required.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // Read and lock saved system settings.
    const [settingsRows] = await connection.query(`
      SELECT
        temperature_min,
        temperature_max,
        ph_min,
        ph_max,
        tds_max_ppm,
        turbidity_max,
        water_level_min,
        warning_alerts_enabled,
        auto_water_change_enabled
      FROM system_settings
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
    `);

    if (settingsRows.length === 0) {
      await connection.rollback();

      return res.status(503).json({
        success: false,
        message:
          "System settings are not configured.",
      });
    }

    const settings = settingsRows[0];

    // Save the incoming water quality reading.
    const [insertResult] = await connection.execute(
      `INSERT INTO water_quality_readings
       (
         temperature,
         ph_level,
         tds_ppm,
         turbidity,
         water_level
       )
       VALUES (?, ?, ?, ?, ?)`,
      PARAMETER_KEYS.map(
        (key) => readings[key]
      )
    );

    const generatedAlerts = [];
    const resolvedParameters = [];

    // ------------------------------------------------
    // AUTOMATIC WATER QUALITY ALERTS
    // ------------------------------------------------

    for (const parameter of PARAMETERS) {
      const value = readings[parameter.key];

      // Missing readings must not resolve alerts.
      if (value === null) {
        continue;
      }

      await connection.execute(
        `INSERT INTO water_quality_alert_states
         (
           parameter_name,
           condition_status,
           last_reading_value
         )
         VALUES (?, 'Resolved', ?)
         ON DUPLICATE KEY UPDATE
           parameter_name = parameter_name`,
        [parameter.key, value]
      );

      const [stateRows] = await connection.execute(
        `SELECT
           id,
           condition_status
         FROM water_quality_alert_states
         WHERE parameter_name = ?
         FOR UPDATE`,
        [parameter.key]
      );

      if (stateRows.length === 0) {
        throw new Error(
          `Alert state not found for ${parameter.key}.`
        );
      }

      const state = stateRows[0];

      const isAbnormal = isOutsideThreshold(
        value,
        parameter,
        settings
      );

      if (isAbnormal) {
        if (state.condition_status !== "Active") {
          let alertId = null;

          if (
            Number(settings.warning_alerts_enabled) === 1
          ) {
            const title =
              `${parameter.label} Warning`;

            const message =
              `${parameter.label} recorded ${value} ` +
              `${parameter.unit}, outside the configured ` +
              `range (${describeThreshold(
                parameter,
                settings
              )}).`;

            const [alertResult] =
              await connection.execute(
                `INSERT INTO alerts
                 (
                   title,
                   message,
                   severity,
                   category
                 )
                 VALUES (
                   ?,
                   ?,
                   'Warning',
                   'Water Quality'
                 )`,
                [title, message]
              );

            alertId = alertResult.insertId;

            generatedAlerts.push({
              id: alertId,
              parameter: parameter.key,
              title,
            });
          }

          await connection.execute(
            `UPDATE water_quality_alert_states
             SET
               condition_status = 'Active',
               last_alert_id = ?,
               last_reading_value = ?
             WHERE id = ?`,
            [
              alertId,
              value,
              state.id,
            ]
          );
        } else {
          await connection.execute(
            `UPDATE water_quality_alert_states
             SET last_reading_value = ?
             WHERE id = ?`,
            [value, state.id]
          );
        }
      } else {
        if (
          state.condition_status === "Active"
        ) {
          resolvedParameters.push(
            parameter.key
          );
        }

        await connection.execute(
          `UPDATE water_quality_alert_states
           SET
             condition_status = 'Resolved',
             last_reading_value = ?
           WHERE id = ?`,
          [
            value,
            state.id,
          ]
        );
      }
    }

    // ------------------------------------------------
    // AUTOMATIC AERATION
    // ------------------------------------------------

    const automaticAeration =
      getAutomaticAerationStatus();

    // ------------------------------------------------
    // AUTOMATIC PARTIAL WATER CHANGE
    // ------------------------------------------------

    const automaticWaterChange =
      await evaluateAutomaticWaterChange(
        connection,
        readings.turbidity,
        readings.water_level,
        settings
      );

    // Save all database changes together.
    await connection.commit();

    res.status(201).json({
      success: true,
      message:
        "Water quality reading saved and evaluated successfully.",
      id: insertResult.insertId,
      generated_alerts: generatedAlerts,
      resolved_parameters: resolvedParameters,
      automatic_aeration: automaticAeration,
      automatic_water_change: automaticWaterChange,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Failed to rollback transaction:",
          rollbackError.message
        );
      }
    }

    console.error(
      "Error saving and evaluating water quality:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to save and evaluate water quality reading.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
