const express = require("express");
const router = express.Router();
const db = require("../config/db");

//list de provedores
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM proveedores ORDER BY id_proveedor DESC"
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedores",
      error: err.message,
    });
  }
});

//x id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM proveedores WHERE id_proveedor = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al buscar proveedor",
      error: err.message,
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const { ruc, razon_social, contacto, telefono, direccion } = req.body;

    if (!razon_social || razon_social.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La razón social es obligatoria",
      });
    }

    // validar si el RUC  esta duplicado 
    if (ruc) {
      const [existe] = await db.query(
        "SELECT id_proveedor FROM proveedores WHERE ruc = ?",
        [ruc]
      );

      if (existe.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un proveedor con ese RUC",
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO proveedores (ruc, razon_social, contacto, telefono, direccion)
       VALUES (?, ?, ?, ?, ?)`,
      [ruc || null, razon_social, contacto || null, telefono || null, direccion || null]
    );

    res.status(201).json({
      success: true,
      message: "Proveedor creado correctamente",
      id: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear proveedor",
      error: err.message,
    });
  }
});

//Actualizar
router.put("/:id", async (req, res) => {
  try {
    const { ruc, razon_social, contacto, telefono, direccion } = req.body;

    if (!razon_social || razon_social.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La razón social es obligatoria",
      });
    }

    // Validar si el  RUC  esta duplicado
    if (ruc) {
      const [existe] = await db.query(
        "SELECT id_proveedor FROM proveedores WHERE ruc = ? AND id_proveedor != ?",
        [ruc, req.params.id]
      );

      if (existe.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Ya existe otro proveedor con ese RUC",
        });
      }
    }

    const [result] = await db.query(
      `UPDATE proveedores
       SET ruc = ?, razon_social = ?, contacto = ?, telefono = ?, direccion = ?
       WHERE id_proveedor = ?`,
      [ruc || null, razon_social, contacto, telefono, direccion, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Proveedor actualizado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar proveedor",
      error: err.message,
    });
  }
});

//eliminar al provedor
router.delete("/:id", async (req, res) => {
  try {
    //validar si tiene compras asociadas
    const [compras] = await db.query(
      "SELECT COUNT(*) as total FROM compras WHERE id_proveedor = ?",
      [req.params.id]
    );

    if (compras[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, tiene compras asociadas",
      });
    }

    const [result] = await db.query(
      "DELETE FROM proveedores WHERE id_proveedor = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Proveedor eliminado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar proveedor",
      error: err.message,
    });
  }
});

module.exports = router;