const TELEMETRY_FIELDS = [
  "temperature",
  "ph_level",
  "tds_ppm",
  "turbidity",
  "water_level",
];

const MAX_SERIAL_LINE_LENGTH = 4096;

function parseArduinoLine(line) {
  if (typeof line !== "string") {
    throw new TypeError("Arduino serial frame must be text.");
  }

  const trimmedLine = line.trim();

  if (!trimmedLine) {
    throw new Error("Arduino serial frame cannot be empty.");
  }

  if (trimmedLine.length > MAX_SERIAL_LINE_LENGTH) {
    throw new Error("Arduino serial frame exceeds the maximum length.");
  }

  let message;

  try {
    message = JSON.parse(trimmedLine);
  } catch {
    throw new Error("Arduino serial frame must contain valid JSON.");
  }

  if (
    !message ||
    typeof message !== "object" ||
    Array.isArray(message)
  ) {
    throw new Error("Arduino serial frame must be a JSON object.");
  }

  if (message.type === "heartbeat") {
    return {
      type: "heartbeat",
      device:
        typeof message.device === "string"
          ? message.device
          : null,
      firmwareVersion:
        typeof message.firmware_version === "string"
          ? message.firmware_version
          : null,
    };
  }

  if (message.type !== "telemetry") {
    throw new Error("Unsupported Arduino serial message type.");
  }

  const readings = {};

  for (const field of TELEMETRY_FIELDS) {
    const value = message[field];

    if (value === undefined || value === null) {
      readings[field] = null;
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(
        `Arduino telemetry field "${field}" must be a finite number or null.`
      );
    }

    readings[field] = value;
  }

  if (Object.values(readings).every((value) => value === null)) {
    throw new Error(
      "Arduino telemetry must include at least one numeric sensor reading."
    );
  }

  return {
    type: "telemetry",
    device:
      typeof message.device === "string"
        ? message.device
        : null,
    firmwareVersion:
      typeof message.firmware_version === "string"
        ? message.firmware_version
        : null,
    readings,
  };
}

module.exports = {
  parseArduinoLine,
};
