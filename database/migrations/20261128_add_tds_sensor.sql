USE smart_aqua_pond;

-- Keep historical dissolved-oxygen values in their existing column. They are
-- not converted to TDS because the measurements use different units.
ALTER TABLE water_quality_readings
    ADD COLUMN tds_ppm DECIMAL(8,2) NULL;

ALTER TABLE system_settings
    ADD COLUMN tds_max_ppm DECIMAL(8,2) NULL DEFAULT NULL;

-- Aeration cannot be controlled safely from TDS readings.
UPDATE system_settings
SET auto_aeration_enabled = FALSE;
