-- ============================================================
-- SMART Aqua Pond
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_aqua_pond;

USE smart_aqua_pond;

-- ============================================================
-- 1. WATER QUALITY READINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS water_quality_readings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NULL,
    ph_level DECIMAL(4,2) NULL,
    dissolved_oxygen DECIMAL(5,2) NULL,
    turbidity DECIMAL(7,2) NULL,
    water_level DECIMAL(5,2) NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('Critical', 'Warning', 'Info') NOT NULL,
    category VARCHAR(50) NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. FEEDING SCHEDULES
-- ============================================================

CREATE TABLE IF NOT EXISTS feeding_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feeding_time TIME NOT NULL,
    feeding_days JSON NOT NULL,
    amount DECIMAL(7,2) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. FEEDING HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS feeding_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    feeding_schedule_id BIGINT UNSIGNED NULL,
    trigger_type ENUM('Automatic', 'Manual') NOT NULL,
    status ENUM('Completed', 'Failed', 'Pending') NOT NULL,
    amount DECIMAL(7,2) NULL,
    fed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feeding_history_schedule
        FOREIGN KEY (feeding_schedule_id)
        REFERENCES feeding_schedules(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 5. EQUIPMENT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS equipment_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    control_mode ENUM('Automatic', 'Manual') NOT NULL,
    status ENUM('Success', 'Failed') NOT NULL DEFAULT 'Success',
    details TEXT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    temperature_min DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    temperature_max DECIMAL(5,2) NOT NULL DEFAULT 30.00,

    ph_min DECIMAL(4,2) NOT NULL DEFAULT 6.50,
    ph_max DECIMAL(4,2) NOT NULL DEFAULT 8.50,

    dissolved_oxygen_min DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    turbidity_max DECIMAL(7,2) NOT NULL DEFAULT 5.00,
    water_level_min DECIMAL(5,2) NOT NULL DEFAULT 70.00,

    critical_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    warning_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    equipment_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    fish_behavior_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    auto_aeration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_water_change_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. FISH BEHAVIOR LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS fish_behavior_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_status ENUM('Normal', 'Abnormal') NOT NULL,
    behavior_type VARCHAR(100) NULL,
    confidence_score DECIMAL(5,2) NULL,
    description TEXT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (
    temperature_min,
    temperature_max,
    ph_min,
    ph_max,
    dissolved_oxygen_min,
    turbidity_max,
    water_level_min,
    critical_alerts_enabled,
    warning_alerts_enabled,
    equipment_alerts_enabled,
    fish_behavior_alerts_enabled,
    auto_aeration_enabled,
    auto_water_change_enabled
)
SELECT
    25.00,
    30.00,
    6.50,
    8.50,
    5.00,
    5.00,
    70.00,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings
);

-- ============================================================
-- SYNTHETIC PROTOTYPE DATA
-- ============================================================
-- Sensor readings are simulated calibrated outputs, not measurements from
-- connected hardware. Temperature is in C, dissolved oxygen in mg/L,
-- turbidity in NTU, and water level as a percentage of the calibrated range.
-- Fixed timestamps / feeding times prevent duplicates when this file is rerun.

START TRANSACTION;

INSERT INTO water_quality_readings (
    temperature, ph_level, dissolved_oxygen, turbidity, water_level, recorded_at
)
SELECT sample.temperature, sample.ph_level, sample.dissolved_oxygen,
       sample.turbidity, sample.water_level, sample.recorded_at
FROM (
    SELECT 28.10 AS temperature, 7.18 AS ph_level, 6.35 AS dissolved_oxygen,
           2.10 AS turbidity, 85.00 AS water_level, '2026-11-08 10:00:00' AS recorded_at
    UNION ALL SELECT 28.30, 7.20, 6.40, 2.05, 85.00, '2026-11-08 11:00:00'
    UNION ALL SELECT 28.50, 7.22, 6.55, 2.15, 85.00, '2026-11-08 12:00:00'
    UNION ALL SELECT 28.70, 7.25, 6.68, 2.25, 84.90, '2026-11-08 13:00:00'
    UNION ALL SELECT 28.90, 7.28, 6.80, 2.35, 84.90, '2026-11-08 14:00:00'
    UNION ALL SELECT 29.00, 7.30, 6.92, 2.50, 84.90, '2026-11-08 15:00:00'
    UNION ALL SELECT 28.90, 7.32, 6.88, 2.60, 84.90, '2026-11-08 16:00:00'
    UNION ALL SELECT 28.70, 7.35, 6.72, 2.55, 84.90, '2026-11-08 17:00:00'
    UNION ALL SELECT 28.40, 7.36, 6.58, 2.40, 84.80, '2026-11-08 18:00:00'
    UNION ALL SELECT 28.20, 7.34, 6.42, 2.30, 84.80, '2026-11-08 19:00:00'
    UNION ALL SELECT 28.00, 7.32, 6.25, 2.25, 84.80, '2026-11-08 20:00:00'
    UNION ALL SELECT 27.80, 7.30, 6.10, 2.20, 84.80, '2026-11-08 21:00:00'
    UNION ALL SELECT 27.70, 7.28, 5.98, 2.15, 84.80, '2026-11-08 22:00:00'
    UNION ALL SELECT 27.60, 7.26, 5.90, 2.20, 84.80, '2026-11-08 23:00:00'
    UNION ALL SELECT 27.50, 7.25, 5.82, 2.18, 84.70, '2026-11-09 00:00:00'
    UNION ALL SELECT 27.40, 7.23, 5.75, 2.15, 84.70, '2026-11-09 01:00:00'
    UNION ALL SELECT 27.30, 7.22, 5.70, 2.12, 84.70, '2026-11-09 02:00:00'
    UNION ALL SELECT 27.20, 7.21, 5.66, 2.10, 84.70, '2026-11-09 03:00:00'
    UNION ALL SELECT 27.10, 7.20, 5.62, 2.08, 84.70, '2026-11-09 04:00:00'
    UNION ALL SELECT 27.10, 7.19, 5.60, 2.05, 84.60, '2026-11-09 05:00:00'
    UNION ALL SELECT 27.20, 7.20, 5.64, 2.10, 84.60, '2026-11-09 06:00:00'
    UNION ALL SELECT 27.50, 7.22, 5.78, 2.15, 84.60, '2026-11-09 07:00:00'
    UNION ALL SELECT 27.80, 7.23, 5.92, 2.20, 84.60, '2026-11-09 08:00:00'
    UNION ALL SELECT 28.10, 7.25, 6.08, 2.18, 84.60, '2026-11-09 09:00:00'
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM water_quality_readings existing
    WHERE existing.recorded_at = sample.recorded_at
);

INSERT INTO alerts (title, message, severity, category, acknowledged, created_at)
SELECT sample.title, sample.message, sample.severity, sample.category,
       sample.acknowledged, sample.created_at
FROM (
    SELECT 'Water temperature elevated' AS title,
           'Water temperature is approaching the configured upper limit.' AS message,
           'Warning' AS severity, 'Water Quality' AS category,
           FALSE AS acknowledged, '2026-11-09 08:10:00' AS created_at
    UNION ALL SELECT 'Dissolved oxygen check', 'Dissolved oxygen is within the safe range.',
           'Info', 'Water Quality', TRUE, '2026-11-09 09:10:00'
    UNION ALL SELECT 'Water level dropping', 'Water level has decreased and should be monitored.',
           'Warning', 'Water Quality', FALSE, '2026-11-09 10:10:00'
    UNION ALL SELECT 'Routine pond inspection', 'Scheduled visual inspection reminder.',
           'Info', 'Maintenance', TRUE, '2026-11-09 11:10:00'
    UNION ALL SELECT 'Low dissolved oxygen detected', 'Check aeration and re-test the pond water.',
           'Critical', 'Water Quality', FALSE, '2026-11-09 12:10:00'
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM alerts existing
    WHERE existing.created_at = sample.created_at
);

INSERT INTO feeding_schedules (feeding_time, feeding_days, amount, enabled)
SELECT sample.feeding_time, sample.feeding_days, sample.amount, TRUE
FROM (
    SELECT '06:00:00' AS feeding_time, '["Monday","Wednesday","Friday"]' AS feeding_days,
           25.00 AS amount
    UNION ALL SELECT '07:00:00', '["Tuesday","Thursday","Saturday"]', 24.00
    UNION ALL SELECT '08:00:00', '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]', 20.00
    UNION ALL SELECT '16:00:00', '["Monday","Wednesday","Friday"]', 25.00
    UNION ALL SELECT '17:00:00', '["Tuesday","Thursday","Saturday"]', 24.00
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM feeding_schedules existing
    WHERE existing.feeding_time = sample.feeding_time
      AND existing.amount = sample.amount
);

INSERT INTO feeding_history (
    feeding_schedule_id, trigger_type, status, amount, fed_at
)
SELECT NULL, sample.trigger_type, sample.status, sample.amount, sample.fed_at
FROM (
    SELECT 'Automatic' AS trigger_type, 'Completed' AS status,
           25.00 AS amount, '2026-11-09 06:05:00' AS fed_at
    UNION ALL SELECT 'Manual', 'Completed', 20.00, '2026-11-09 08:15:00'
    UNION ALL SELECT 'Automatic', 'Completed', 24.00, '2026-11-09 09:05:00'
    UNION ALL SELECT 'Manual', 'Failed', 20.00, '2026-11-09 11:30:00'
    UNION ALL SELECT 'Automatic', 'Pending', 25.00, '2026-11-09 16:05:00'
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM feeding_history existing
    WHERE existing.fed_at = sample.fed_at
);

INSERT INTO equipment_logs (
    equipment_name, action, control_mode, status, details, recorded_at
)
SELECT sample.equipment_name, sample.action, sample.control_mode,
       sample.status, sample.details, sample.recorded_at
FROM (
    SELECT 'Aeration System' AS equipment_name, 'ON' AS action,
           'Automatic' AS control_mode, 'Success' AS status,
           'Prototype sample: aeration started after a routine check.' AS details,
           '2026-11-09 08:20:00' AS recorded_at
    UNION ALL SELECT 'Water Pump', 'OFF', 'Manual', 'Success',
           'Prototype sample: water pump switched off.', '2026-11-09 09:20:00'
    UNION ALL SELECT 'Automatic Fish Feeder', 'ON', 'Automatic', 'Success',
           'Prototype sample: scheduled feeding cycle completed.', '2026-11-09 10:20:00'
    UNION ALL SELECT 'Aeration System', 'OFF', 'Manual', 'Failed',
           'Prototype sample: simulated control action failed.', '2026-11-09 11:20:00'
    UNION ALL SELECT 'Water Pump', 'ON', 'Automatic', 'Success',
           'Prototype sample: water circulation started.', '2026-11-09 12:20:00'
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM equipment_logs existing
    WHERE existing.recorded_at = sample.recorded_at
);

INSERT INTO fish_behavior_logs (
    activity_status, behavior_type, confidence_score, description, detected_at
)
SELECT sample.activity_status, sample.behavior_type, sample.confidence_score,
       sample.description, sample.detected_at
FROM (
    SELECT 'Normal' AS activity_status, 'Steady swimming' AS behavior_type,
           96.00 AS confidence_score,
           'Prototype observation: fish swimming at a steady pace.' AS description,
           '2026-11-09 08:30:00' AS detected_at
    UNION ALL SELECT 'Normal', 'Group feeding', 94.00,
           'Prototype observation: fish feeding normally near the surface.',
           '2026-11-09 09:30:00'
    UNION ALL SELECT 'Abnormal', 'Surface gasping', 82.00,
           'Prototype observation: fish gathered near the surface; check oxygen.',
           '2026-11-09 10:30:00'
    UNION ALL SELECT 'Normal', 'Resting', 90.00,
           'Prototype observation: low activity during a resting period.',
           '2026-11-09 11:30:00'
    UNION ALL SELECT 'Abnormal', 'Erratic swimming', 76.00,
           'Prototype observation: unusual movement; inspect pond conditions.',
           '2026-11-09 12:30:00'
) AS sample
WHERE NOT EXISTS (
    SELECT 1 FROM fish_behavior_logs existing
    WHERE existing.detected_at = sample.detected_at
);

COMMIT;

-- ============================================================
-- END OF SMART AQUA POND DATABASE SCHEMA
-- ============================================================