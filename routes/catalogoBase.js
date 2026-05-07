const express = require("express");
const db = require("../config/db");


function createCatalogRouter({ table, idField, label }) {
  const router = express.Router();

  //LISTAR TODOS
  router.get("/", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT * FROM ${table} ORDER BY estado DESC, nombre ASC`,
      );

      res.json({
        success: true,
        data: rows,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: `Error al obtener ${label.toLowerCase()}`,
        error: err.message,
      });
    }
  });

  
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);

  //LISTAR ACTIVOS
  router.get("/activos", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE estado = 'ACTIVO' ORDER BY nombre ASC`,
      );

      res.json({
        success: true,
        data: rows,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: `Error al obtener ${label.toLowerCase()} activos`,
        error: err.message,
      });
    }
  });

  //OBTENER POR ID
  router.get("/:id", async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT * FROM ${table} WHERE ${idField} = ?`,
        [req.params.id],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `${label} no encontrado`,
        });
      }

      res.json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: `Error al buscar ${label.toLowerCase()}`,
        error: err.message,
      });
    }
  });

  //CREAR
  router.post("/", async (req, res) => {
    try {
      const { nombre } = req.body;

      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "El nombre es obligatorio",
        });
      }

      await db.query(`INSERT INTO ${table} (nombre) VALUES (?)`, [
        nombre.trim(),
      ]);

      res.status(201).json({
        success: true,
        message: `${label} creado correctamente`,
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: `Ya existe un ${label.toLowerCase()} con ese nombre`,
        });
      }

      res.status(500).json({
        success: false,
        message: `Error al crear ${label.toLowerCase()}`,
        error: err.message,
      });
    }
  });

  //ACTUALIZAR NOMBRE
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
        `UPDATE ${table} SET nombre = ? WHERE ${idField} = ?`,
        [nombre.trim(), req.params.id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `${label} no encontrado`,
        });
      }

      res.json({
        success: true,
        message: `${label} actualizado correctamente`,
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          success: false,
          message: `Ya existe un ${label.toLowerCase()} con ese nombre`,
        });
      }

      res.status(500).json({
        success: false,
        message: `Error al actualizar ${label.toLowerCase()}`,
        error: err.message,
      });
    }
  });

  //para cambiar el estado (softdelete / restaurar)
  router.put("/:id/estado", async (req, res) => {
    try {
      const { estado } = req.body;

      if (!["ACTIVO", "INACTIVO"].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: "Estado inválido",
        });
      }

      const [result] = await db.query(
        `UPDATE ${table} SET estado = ? WHERE ${idField} = ?`,
        [estado, req.params.id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: `${label} no encontrado`,
        });
      }

      res.json({
        success: true,
        message: `Estado de ${label.toLowerCase()} actualizado correctamente`,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: `Error al cambiar estado de ${label.toLowerCase()}`,
        error: err.message,
      });
    }
  });

  return router;
}

module.exports = createCatalogRouter;
