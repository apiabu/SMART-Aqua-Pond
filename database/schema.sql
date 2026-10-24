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
-- END OF SMART AQUA POND DATABASE SCHEMA
-- ============================================================