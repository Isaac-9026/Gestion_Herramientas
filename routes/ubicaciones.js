const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);


router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ubicaciones ORDER BY id_ubicacion DESC"
    );

    res.json({
      success: true,
      data: rows,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicaciones",
      error: err.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ubicaciones WHERE id_ubicacion = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ubicación no encontrada",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener ubicación",
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre de la ubicación es obligatorio",
      });
    }

    const [result] = await db.query(
      "INSERT INTO ubicaciones (nombre) VALUES (?)",
      [nombre.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Ubicación creada correctamente",
      id_ubicacion: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear ubicación",
      error: err.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre es obligatorio",
      });
    }

    const [result] = await db.query(
      "UPDATE ubicaciones SET nombre = ? WHERE id_ubicacion = ?",
      [nombre.trim(), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Ubicación no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Ubicación actualizada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar ubicación",
      error: err.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    //Validación: no eliminar si está en uso en herramientas
    const [uso] = await db.query(
      "SELECT COUNT(*) as total FROM herramientas WHERE id_ubicacion = ?",
      [req.params.id]
    );

    if (uso[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, ubicación en uso por herramientas",
      });
    }

    const [result] = await db.query(
      "DELETE FROM ubicaciones WHERE id_ubicacion = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Ubicación no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Ubicación eliminada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar ubicación",
      error: err.message,
    });
  }
});

module.exports = router;