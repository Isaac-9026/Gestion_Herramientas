const express = require("express");
const router = express.Router();
const db = require("../config/db");

//incompleto
// Solo para obtener todas las areas
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM areas ORDER BY nombre ASC");

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener áreas",
      error: err.message,
    });
  }
});

module.exports = router;
