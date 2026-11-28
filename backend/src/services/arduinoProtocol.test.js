const assert = require("node:assert/strict");
const test = require("node:test");
const { parseArduinoLine } = require("./arduinoProtocol");

test("parses controller heartbeat frames", () => {
  assert.deepEqual(
    parseArduinoLine(
      '{"type":"heartbeat","device":"uno-r4-minima","firmware_version":"0.1.0"}'
    ),
    {
      type: "heartbeat",
      device: "uno-r4-minima",
      firmwareVersion: "0.1.0",
    }
  );
});

test("maps telemetry frames to the water-quality API fields", () => {
  assert.deepEqual(
    parseArduinoLine(
      '{"type":"telemetry","temperature":26.4,"tds_ppm":350}'
    ),
    {
      type: "telemetry",
      device: null,
      firmwareVersion: null,
      readings: {
        temperature: 26.4,
        ph_level: null,
        tds_ppm: 350,
        turbidity: null,
        water_level: null,
      },
    }
  );
});

test("rejects malformed, unsupported, and empty telemetry frames", () => {
  assert.throws(
    () => parseArduinoLine("{"),
    /valid JSON/
  );
  assert.throws(
    () => parseArduinoLine('{"type":"command"}'),
    /Unsupported/
  );
  assert.throws(
    () => parseArduinoLine('{"type":"telemetry"}'),
    /at least one numeric/
  );
  assert.throws(
    () =>
      parseArduinoLine(
        '{"type":"telemetry","tds_ppm":"350"}'
      ),
    /finite number or null/
  );
});
