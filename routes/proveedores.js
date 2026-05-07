const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);


// GET
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM proveedores ORDER BY razon_social ASC"
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener proveedores",
      error: err.message
    });
  }
});


// POST
router.post("/", async (req, res) => {
  try {
    const { ruc, razon_social, contacto, telefono, direccion } = req.body;

    // VALIDACIONES PRO
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      return res.status(400).json({
        success: false,
        message: "El RUC debe tener 11 dígitos numéricos"
      });
    }

    if (!razon_social || razon_social.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La razón social es obligatoria"
      });
    }

    await db.query(
      `INSERT INTO proveedores 
      (ruc, razon_social, contacto, telefono, direccion)
      VALUES (?, ?, ?, ?, ?)`,
      [ruc, razon_social, contacto, telefono, direccion]
    );

    res.status(201).json({
      success: true,
      message: "Proveedor creado correctamente"
    });

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "El RUC ya existe"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear proveedor",
      error: err.message
    });
  }
});


// PUT (editar)
router.put("/:id", async (req, res) => {
  try {
    const { ruc, razon_social, contacto, telefono, direccion } = req.body;

    await db.query(
      `UPDATE proveedores 
       SET ruc = ?, razon_social = ?, contacto = ?, telefono = ?, direccion = ?
       WHERE id_proveedor = ?`,
      [ruc, razon_social, contacto, telefono, direccion, req.params.id]
    );

    res.json({
      success: true,
      message: "Proveedor actualizado correctamente"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar proveedor",
      error: err.message
    });
  }
});


// SOFT DELETE
router.put("/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;

    await db.query(
      "UPDATE proveedores SET estado = ? WHERE id_proveedor = ?",
      [estado, req.params.id]
    );

    res.json({
      success: true,
      message: "Estado actualizado"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado",
      error: err.message
    });
  }
});

module.exports = router;