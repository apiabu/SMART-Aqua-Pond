const express = require("express");
const { getArduinoStatus } = require("../services/arduinoSerialService");

const router = express.Router();

router.get("/status", (req, res) => {
  res.status(200).json({
    success: true,
    data: getArduinoStatus(),
  });
});

module.exports = router;
