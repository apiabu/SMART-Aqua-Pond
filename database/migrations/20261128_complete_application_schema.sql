USE smart_aqua_pond;

CREATE TABLE IF NOT EXISTS fish_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fish_name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE fish_behavior_logs
    ADD COLUMN fish_id BIGINT UNSIGNED NULL,
    ADD COLUMN detection_source
        ENUM('Manual', 'Prototype', 'Camera Analysis')
        NOT NULL DEFAULT 'Prototype',
    ADD CONSTRAINT fk_fish_behavior_profile
        FOREIGN KEY (fish_id)
        REFERENCES fish_profiles(id)
        ON DELETE SET NULL;

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

CREATE TABLE IF NOT EXISTS automatic_aeration_state (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL UNIQUE,
    requested_state ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
    last_reading_value DECIMAL(8,2) NULL
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
