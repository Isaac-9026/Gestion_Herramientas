const express = require("express");
const router = express.Router();
const db = require("../config/db");

//obtener productos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, 
             m.nombre AS marca,
             c.nombre AS categoria
      FROM productos p
      LEFT JOIN marcas m ON p.id_marca = m.id_marca
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY p.id_producto DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener productos",
      error: err.message,
    });
  }
});

//obtener productos x id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM productos WHERE id_producto = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al buscar producto",
      error: err.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, modelo, id_marca, id_categoria } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre es obligatorio",
      });
    }

    const [result] = await db.query(
      `INSERT INTO productos (nombre, modelo, id_marca, id_categoria)
       VALUES (?, ?, ?, ?)`,
      [nombre, modelo, id_marca, id_categoria]
    );

    res.status(201).json({
      success: true,
      message: "Producto creado correctamente",
      id: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear producto",
      error: err.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nombre, modelo, id_marca, id_categoria } = req.body;

    const [result] = await db.query(
      `UPDATE productos 
       SET nombre = ?, modelo = ?, id_marca = ?, id_categoria = ?
       WHERE id_producto = ?`,
      [nombre, modelo, id_marca, id_categoria, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Producto actualizado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar producto",
      error: err.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // Validar si tiene herramientas
    const [rows] = await db.query(
      "SELECT COUNT(*) as total FROM herramientas WHERE id_producto = ?",
      [req.params.id]
    );

    if (rows[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, producto con herramientas asociadas",
      });
    }

    const [result] = await db.query(
      "DELETE FROM productos WHERE id_producto = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Producto eliminado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar producto",
      error: err.message,
    });
  }
});

module.exports = router;