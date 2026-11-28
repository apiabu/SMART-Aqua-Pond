const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { parseArduinoLine } = require("./arduinoProtocol");

const DEFAULT_BAUD_RATE = 115200;
const RECONNECT_DELAY_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 15000;

const status = {
  configured: false,
  connected: false,
  port: null,
  baudRate: DEFAULT_BAUD_RATE,
  lastMessageAt: null,
  lastTelemetryAt: null,
  device: null,
  firmwareVersion: null,
  lastError: null,
};

let running = false;
let opening = false;
let serialPort = null;
let reconnectTimer = null;
let messageQueue = Promise.resolve();

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : String(error);
}

function getArduinoStatus() {
  const lastMessageTimestamp = status.lastMessageAt
    ? Date.parse(status.lastMessageAt)
    : Number.NaN;

  const online =
    status.connected &&
    Number.isFinite(lastMessageTimestamp) &&
    Date.now() - lastMessageTimestamp <= HEARTBEAT_TIMEOUT_MS;

  return {
    ...status,
    online,
    mode: "telemetry-only",
  };
}

async function processSerialLine(line, telemetryUrl) {
  const message = parseArduinoLine(line);
  const receivedAt = new Date().toISOString();

  status.lastMessageAt = receivedAt;

  if (message.device) {
    status.device = message.device;
  }

  if (message.firmwareVersion) {
    status.firmwareVersion = message.firmwareVersion;
  }

  if (message.type === "heartbeat") {
    return;
  }

  const response = await fetch(telemetryUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message.readings),
  });

  if (!response.ok) {
    const responseText = await response.text();
    const details = responseText.trim().slice(0, 200);

    throw new Error(
      `Water-quality API rejected Arduino telemetry (${response.status})` +
        (details ? `: ${details}` : ".")
    );
  }

  status.lastTelemetryAt = new Date().toISOString();
  status.lastError = null;
}

function scheduleReconnect(portPath, baudRate, telemetryUrl) {
  if (!running || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSerialPort(portPath, baudRate, telemetryUrl);
  }, RECONNECT_DELAY_MS);

  reconnectTimer.unref();
}

function connectSerialPort(portPath, baudRate, telemetryUrl) {
  if (
    !running ||
    opening ||
    (serialPort && serialPort.isOpen)
  ) {
    return;
  }

  opening = true;
  const candidate = new SerialPort({
    path: portPath,
    baudRate,
    autoOpen: false,
  });
  serialPort = candidate;

  const isCurrentPort = () => serialPort === candidate;
  const parser = candidate.pipe(
    new ReadlineParser({ delimiter: "\n" })
  );

  parser.on("data", (line) => {
    messageQueue = messageQueue
      .then(() =>
        processSerialLine(String(line), telemetryUrl)
      )
      .catch((error) => {
        status.lastError = getErrorMessage(error);
        console.error(
          "Arduino serial frame processing failed:",
          status.lastError
        );
      });
  });

  candidate.on("open", () => {
    if (!isCurrentPort()) {
      return;
    }

    opening = false;
    status.connected = true;
    status.lastError = null;
    console.log(`Arduino serial port opened: ${portPath}`);
  });

  candidate.on("close", () => {
    if (!isCurrentPort()) {
      return;
    }

    opening = false;
    status.connected = false;
    status.lastMessageAt = null;
    scheduleReconnect(portPath, baudRate, telemetryUrl);
  });

  candidate.on("error", (error) => {
    if (!isCurrentPort()) {
      return;
    }

    opening = false;
    status.connected = false;
    status.lastMessageAt = null;
    status.lastError = getErrorMessage(error);
    console.error(
      `Arduino serial port error (${portPath}):`,
      status.lastError
    );
    scheduleReconnect(portPath, baudRate, telemetryUrl);
  });

  candidate.open((error) => {
    if (!error || !isCurrentPort()) {
      return;
    }

    opening = false;
    status.connected = false;
    status.lastMessageAt = null;
    status.lastError = getErrorMessage(error);
    console.error(
      `Could not open Arduino serial port (${portPath}):`,
      status.lastError
    );
    scheduleReconnect(portPath, baudRate, telemetryUrl);
  });
}

function startArduinoSerialBridge({ backendPort = 5000 } = {}) {
  if (running) {
    return;
  }

  const portPath = process.env.ARDUINO_SERIAL_PORT?.trim();
  const baudRateValue = process.env.ARDUINO_SERIAL_BAUD_RATE?.trim();
  const parsedBaudRate = baudRateValue
    ? Number(baudRateValue)
    : DEFAULT_BAUD_RATE;
  const validBaudRate =
    Number.isInteger(parsedBaudRate) && parsedBaudRate > 0;
  const baudRate = validBaudRate
    ? parsedBaudRate
    : DEFAULT_BAUD_RATE;

  status.port = portPath || null;
  status.baudRate = baudRate;
  status.configured = Boolean(portPath);

  if (!portPath) {
    console.info(
      "Arduino serial bridge is disabled; configure ARDUINO_SERIAL_PORT to enable it."
    );
    return;
  }

  if (!validBaudRate) {
    status.lastError =
      "ARDUINO_SERIAL_BAUD_RATE must be a positive integer.";
    console.error(status.lastError);
    return;
  }

  const telemetryUrl =
    `http://127.0.0.1:${backendPort}/api/water-quality`;

  running = true;
  connectSerialPort(portPath, baudRate, telemetryUrl);
}

function stopArduinoSerialBridge() {
  running = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (serialPort?.isOpen) {
    serialPort.close((error) => {
      if (error) {
        console.error(
          "Failed to close Arduino serial port:",
          error.message
        );
      }
    });
  }
}

module.exports = {
  getArduinoStatus,
  startArduinoSerialBridge,
  stopArduinoSerialBridge,
};
