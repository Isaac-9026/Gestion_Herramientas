const express = require("express");
const router = express.Router();
const db = require("../config/db");

//obtener herramientas
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM herramientas ORDER BY id_herramienta DESC"
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener herramientas",
      error: err.message,
    });
  }
});

//obtener herramientas x id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM herramientas WHERE id_herramienta = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Herramienta no encontrada",
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al buscar herramienta",
      error: err.message,
    });
  }
});

//enviar herramientas
router.post("/", async (req, res) => {
  try {
    const {
      codigo_inventario,
      numero_serie,
      id_producto,
      estado,
      id_ubicacion
    } = req.body;

    if (!codigo_inventario || codigo_inventario.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El código de inventario es obligatorio",
      });
    }

    const [result] = await db.query(
      `INSERT INTO herramientas 
      (codigo_inventario, numero_serie, id_producto, estado, id_ubicacion) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        codigo_inventario,
        numero_serie,
        id_producto,
        estado || "BUENO",
        id_ubicacion
      ]
    );

    res.status(201).json({
      success: true,
      message: "Herramienta creada correctamente",
      id: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear herramienta",
      error: err.message,
    });
  }
});

//actualizar herramientas
router.put("/:id", async (req, res) => {
  try {
    const {
      codigo_inventario,
      numero_serie,
      id_producto,
      estado,
      id_ubicacion
    } = req.body;

    if (!codigo_inventario || codigo_inventario.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El código es obligatorio",
      });
    }

    const [result] = await db.query(
      `UPDATE herramientas 
       SET codigo_inventario = ?, numero_serie = ?, id_producto = ?, estado = ?, id_ubicacion = ?
       WHERE id_herramienta = ?`,
      [
        codigo_inventario,
        numero_serie,
        id_producto,
        estado,
        id_ubicacion,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Herramienta no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Herramienta actualizada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar herramienta",
      error: err.message,
    });
  }
});

//borrar herramientas
router.delete("/:id", async (req, res) => {
  try {
    //Validación: si esta en prestamos
    const [prestamos] = await db.query(
      "SELECT COUNT(*) as total FROM detalle_prestamo WHERE id_herramienta = ?",
      [req.params.id]
    );

    if (prestamos[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, herramienta en uso en préstamos",
      });
    }

    const [result] = await db.query(
      "DELETE FROM herramientas WHERE id_herramienta = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Herramienta no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Herramienta eliminada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar herramienta",
      error: err.message,
    });
  }
});

module.exports = router;