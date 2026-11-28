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
    tds_ppm DECIMAL(8,2) NULL,
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
-- 6. FISH PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS fish_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fish_name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    temperature_min DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    temperature_max DECIMAL(5,2) NOT NULL DEFAULT 30.00,

    ph_min DECIMAL(4,2) NOT NULL DEFAULT 6.50,
    ph_max DECIMAL(4,2) NOT NULL DEFAULT 8.50,

    tds_max_ppm DECIMAL(8,2) NULL DEFAULT NULL,
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
-- 8. WATER QUALITY ALERT STATES
-- ============================================================

CREATE TABLE IF NOT EXISTS water_quality_alert_states (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    parameter_name VARCHAR(50) NOT NULL UNIQUE,
    condition_status ENUM('Active', 'Resolved') NOT NULL DEFAULT 'Resolved',
    last_alert_id BIGINT UNSIGNED NULL,
    last_reading_value DECIMAL(12,2) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_water_quality_alert_state_alert
        FOREIGN KEY (last_alert_id)
        REFERENCES alerts(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 9. AUTOMATIC AERATION STATE - SIMULATION
-- ============================================================

CREATE TABLE IF NOT EXISTS automatic_aeration_state (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL UNIQUE,
    requested_state ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    last_reading_value DECIMAL(8,2) NULL
);

-- ============================================================
-- 10. AUTOMATIC WATER-CHANGE HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS automatic_water_change_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cycle_status ENUM('Requested', 'Completed', 'Cancelled') NOT NULL,
    target_percentage DECIMAL(5,2) NOT NULL,
    trigger_parameter VARCHAR(50) NULL,
    trigger_value DECIMAL(12,2) NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 11. AUTOMATIC WATER-CHANGE CURRENT STATE
-- ============================================================

CREATE TABLE IF NOT EXISTS automatic_water_change_state (
    id TINYINT UNSIGNED PRIMARY KEY,
    history_id BIGINT UNSIGNED NULL,
    cycle_status ENUM('Requested', 'Completed', 'Cancelled') NOT NULL,
    target_percentage DECIMAL(5,2) NULL,
    trigger_parameter VARCHAR(50) NULL,
    trigger_value DECIMAL(12,2) NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_water_change_state_history
        FOREIGN KEY (history_id)
        REFERENCES automatic_water_change_history(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 12. FISH BEHAVIOR LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS fish_behavior_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fish_id BIGINT UNSIGNED NULL,
    activity_status ENUM('Normal', 'Abnormal') NOT NULL,
    behavior_type VARCHAR(100) NULL,
    confidence_score DECIMAL(5,2) NULL,
    description TEXT NULL,
    detection_source ENUM('Manual', 'Prototype', 'Camera Analysis')
        NOT NULL DEFAULT 'Prototype',
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fish_behavior_profile
        FOREIGN KEY (fish_id)
        REFERENCES fish_profiles(id)
        ON DELETE SET NULL
);

-- ============================================================
-- 13. FISH APPEARANCE LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS fish_appearance_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fish_id BIGINT UNSIGNED NULL,
    appearance_status ENUM('Normal', 'Possible Abnormality') NOT NULL,
    abnormality_type VARCHAR(100) NULL,
    description TEXT NULL,
    detection_source ENUM('Manual', 'Prototype', 'Camera Analysis')
        NOT NULL DEFAULT 'Prototype',
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_fish_appearance_profile
        FOREIGN KEY (fish_id)
        REFERENCES fish_profiles(id)
        ON DELETE SET NULL
);

-- Upgrade existing installations as CREATE TABLE IF NOT EXISTS does not add
-- columns to tables that already exist.
SET @tds_column_missing = (
    SELECT COUNT(*) = 0
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'water_quality_readings'
      AND column_name = 'tds_ppm'
);

SET @schema_upgrade_sql = IF(
    @tds_column_missing,
    'ALTER TABLE water_quality_readings ADD COLUMN tds_ppm DECIMAL(8,2) NULL',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

SET @schema_upgrade_sql = IF(
    (
        SELECT COUNT(*) = 0
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'system_settings'
          AND column_name = 'tds_max_ppm'
    ),
    'ALTER TABLE system_settings ADD COLUMN tds_max_ppm DECIMAL(8,2) NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

SET @schema_upgrade_sql = IF(
    (
        SELECT COUNT(*) = 0
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'fish_behavior_logs'
          AND column_name = 'fish_id'
    ),
    'ALTER TABLE fish_behavior_logs ADD COLUMN fish_id BIGINT UNSIGNED NULL',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

SET @schema_upgrade_sql = IF(
    (
        SELECT COUNT(*) = 0
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'fish_behavior_logs'
          AND column_name = 'detection_source'
    ),
    'ALTER TABLE fish_behavior_logs ADD COLUMN detection_source ENUM(''Manual'', ''Prototype'', ''Camera Analysis'') NOT NULL DEFAULT ''Prototype''',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

SET @schema_upgrade_sql = IF(
    (
        SELECT COUNT(*) = 0
        FROM information_schema.table_constraints
        WHERE constraint_schema = DATABASE()
          AND table_name = 'fish_behavior_logs'
          AND constraint_name = 'fk_fish_behavior_profile'
          AND constraint_type = 'FOREIGN KEY'
    ),
    'ALTER TABLE fish_behavior_logs ADD CONSTRAINT fk_fish_behavior_profile FOREIGN KEY (fish_id) REFERENCES fish_profiles(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

SET @schema_upgrade_sql = IF(
    @tds_column_missing,
    'UPDATE system_settings SET auto_aeration_enabled = FALSE',
    'SELECT 1'
);
PREPARE schema_upgrade_stmt FROM @schema_upgrade_sql;
EXECUTE schema_upgrade_stmt;
DEALLOCATE PREPARE schema_upgrade_stmt;

-- ============================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (
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
    auto_water_change_enabled
)
SELECT
    25.00,
    30.00,
    6.50,
    8.50,
    NULL,
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

INSERT INTO automatic_aeration_state (
    equipment_name,
    requested_state
)
SELECT 'Aeration System', 'OFF'
WHERE NOT EXISTS (
    SELECT 1
    FROM automatic_aeration_state
    WHERE equipment_name = 'Aeration System'
);

INSERT INTO automatic_water_change_state (
    id,
    cycle_status
)
SELECT 1, 'Completed'
WHERE NOT EXISTS (
    SELECT 1
    FROM automatic_water_change_state
    WHERE id = 1
);

-- No sensor readings or operational sample records are inserted. Data should
-- come from connected hardware or explicit user actions.

-- ============================================================
-- END OF SMART AQUA POND DATABASE SCHEMA
-- ============================================================