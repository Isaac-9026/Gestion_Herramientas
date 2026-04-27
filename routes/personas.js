const express = require("express");
const router = express.Router();
const db = require("../config/db");

//listar personas
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM personas ORDER BY id_persona DESC"
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener personas",
      error: err.message,
    });
  }
});

//consultar personas  por id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM personas WHERE id_persona = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Persona no encontrada",
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al buscar persona",
      error: err.message,
    });
  }
});

//crear persona
router.post("/", async (req, res) => {
  try {
    const { dni, nombres, telefono, direccion } = req.body;

    if (!dni || dni.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El DNI es obligatorio",
      });
    }

    if (!nombres || nombres.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El nombre es obligatorio",
      });
    }

    //validar el duplicado por DNI
    const [existe] = await db.query(
      "SELECT id_persona FROM personas WHERE dni = ?",
      [dni]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe una persona con ese DNI",
      });
    }

    //insert
    const [result] = await db.query(
      `INSERT INTO personas (dni, nombres, telefono, direccion)
       VALUES (?, ?, ?, ?)`,
      [dni, nombres, telefono || null, direccion || null]
    );

    res.status(201).json({
      success: true,
      message: "Persona registrada correctamente",
      id: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al registrar persona",
      error: err.message,
    });
  }
});

//Actualizar persona
router.put("/:id", async (req, res) => {
  try {
    const { dni, nombres, telefono, direccion } = req.body;
    const id = req.params.id;

    if (!dni || !nombres) {
      return res.status(400).json({
        success: false,
        message: "DNI y nombres son obligatorios",
      });
    }

    //volver a validar  el duplicado (a excepto el mismo registro)
    const [existe] = await db.query(
      "SELECT id_persona FROM personas WHERE dni = ? AND id_persona != ?",
      [dni, id]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Ya existe otra persona con ese DNI",
      });
    }

    const [result] = await db.query(
      `UPDATE personas 
       SET dni = ?, nombres = ?, telefono = ?, direccion = ?
       WHERE id_persona = ?`,
      [dni, nombres, telefono, direccion, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Persona no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Persona actualizada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar persona",
      error: err.message,
    });
  }
});

//para eliminar personas
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    //para validar si aun tiene prestamos activos
    const [prestamos] = await db.query(
      "SELECT COUNT(*) as total FROM prestamos WHERE id_persona = ?",
      [id]
    );

    if (prestamos[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, tiene préstamos asociados",
      });
    }

    const [result] = await db.query(
      "DELETE FROM personas WHERE id_persona = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Persona no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Persona eliminada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar persona",
      error: err.message,
    });
  }
});

module.exports = router;