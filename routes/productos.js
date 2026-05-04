const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
  SELECT 
    p.id_producto,
    p.nombre,
    p.modelo,
    p.estado,
    p.id_marca,       
    p.id_categoria,  
    m.nombre AS marca,
    c.nombre AS categoria,

    COUNT(h.id_herramienta) AS total_herramientas,
    SUM(CASE WHEN h.disponible = 1 THEN 1 ELSE 0 END) AS disponibles,
    SUM(CASE WHEN h.disponible = 0 THEN 1 ELSE 0 END) AS en_uso

  FROM productos p
  INNER JOIN marcas m ON p.id_marca = m.id_marca
  INNER JOIN categorias c ON p.id_categoria = c.id_categoria

  LEFT JOIN herramientas h ON p.id_producto = h.id_producto

  GROUP BY p.id_producto

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

router.get("/opciones", async (req, res) => {
  try {
    const [marcas] = await db.query(
      "SELECT id_marca, nombre FROM marcas WHERE estado = 'ACTIVO'",
    );

    const [categorias] = await db.query(
      "SELECT id_categoria, nombre FROM categorias WHERE estado = 'ACTIVO'",
    );

    res.json({
      success: true,
      data: { marcas, categorias },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al cargar opciones",
      error: err.message,
    });
  }
});

//crear producto
router.post("/", async (req, res) => {
  try {
    const { nombre, modelo, id_marca, id_categoria } = req.body;

    if (!nombre || !id_marca || !id_categoria) {
      return res.status(400).json({
        success: false,
        message: "Nombre, marca y categoría son obligatorios",
      });
    }

    //Validación duplicado
    const [exists] = await db.query(
      "SELECT id_producto FROM productos WHERE nombre = ? AND modelo = ?",
      [nombre, modelo],
    );

    if (exists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El producto ya existe",
      });
    }

    await db.query(
      `INSERT INTO productos (nombre, modelo, id_marca, id_categoria)
       VALUES (?, ?, ?, ?)`,
      [nombre, modelo, id_marca, id_categoria],
    );

    res.status(201).json({
      success: true,
      message: "Producto creado correctamente",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear producto",
      error: err.message,
    });
  }
});

//editar
router.put("/:id", async (req, res) => {
  try {
    const { nombre, modelo, id_marca, id_categoria } = req.body;
    const id_producto = req.params.id;

    // ¡NUEVO! Validación de duplicados en edición
    const [exists] = await db.query(
      "SELECT id_producto FROM productos WHERE nombre = ? AND modelo = ? AND id_producto != ?",
      [nombre, modelo, id_producto],
    );

    if (exists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe otro producto con ese nombre y modelo",
      });
    }

    await db.query(
      `UPDATE productos 
       SET nombre = ?, modelo = ?, id_marca = ?, id_categoria = ?
       WHERE id_producto = ?`,
      [nombre, modelo, id_marca, id_categoria, id_producto],
    );

    res.json({ success: true, message: "Producto actualizado" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar",
      error: err.message,
    });
  }
});

//estado (soft delete)
router.put("/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;

    await db.query("UPDATE productos SET estado = ? WHERE id_producto = ?", [
      estado,
      req.params.id,
    ]);

    res.json({
      success: true,
      message: "Estado actualizado",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado",
      error: err.message,
    });
  }
});

module.exports = router;
