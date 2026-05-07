const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);


//GET: PARA LISTAR EMPLEADOS
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
  p.id_persona,
  p.dni,
  p.nombres,
  p.telefono,
  p.direccion,
  p.estado,
  e.id_empleado,
  e.id_area,
  a.nombre AS area
FROM personas p
INNER JOIN empleados e ON p.id_persona = e.id_persona
LEFT JOIN areas a ON e.id_area = a.id_area
ORDER BY p.id_persona DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener empleados",
      error: err.message,
    });
  }
});

//POST: CREAR EMPLEADO (TRANSACCION)
router.post("/", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { dni, nombres, telefono, direccion, id_area } = req.body;

    if (!dni || !nombres || !id_area) {
      return res.status(400).json({
        success: false,
        message: "DNI, nombres y área son obligatorios",
      });
    }

    await conn.beginTransaction();

    // validar DNI único
    const [exists] = await conn.query(
      "SELECT id_persona FROM personas WHERE dni = ?",
      [dni],
    );

    if (exists.length > 0) {
      throw new Error("El DNI ya está registrado");
    }

    // insertar persona
    const [personaResult] = await conn.query(
      `INSERT INTO personas (dni, nombres, telefono, direccion, estado)
       VALUES (?, ?, ?, ?, 'ACTIVO')`,
      [dni, nombres, telefono, direccion],
    );

    const id_persona = personaResult.insertId;

    // insertar empleado
    await conn.query(
      `INSERT INTO empleados (id_persona, id_area)
       VALUES (?, ?)`,
      [id_persona, id_area],
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Empleado creado correctamente",
    });
  } catch (err) {
    await conn.rollback();

    res.status(500).json({
      success: false,
      message: "Error al crear empleado",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});

//actualizar empleado
router.put("/:id", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { dni, nombres, telefono, direccion, id_area, estado } = req.body;
    const id_persona = req.params.id;

    await conn.beginTransaction();

    //Validar que el nuevo DNI no pertenezca a otra persona
    const [exists] = await conn.query(
      "SELECT id_persona FROM personas WHERE dni = ? AND id_persona != ?",
      [dni, id_persona],
    );

    if (exists.length > 0) {
      throw new Error("El DNI ingresado ya pertenece a otro empleado");
    }

    await conn.query(
      `UPDATE personas
       SET dni = ?, nombres = ?, telefono = ?, direccion = ?, estado = ?
       WHERE id_persona = ?`,
      [dni, nombres, telefono, direccion, estado, id_persona],
    );

    await conn.query(
      `UPDATE empleados
       SET id_area = ?
       WHERE id_persona = ?`,
      [id_area, id_persona],
    );

    await conn.commit();

    res.json({
      success: true,
      message: "Empleado actualizado correctamente",
    });
  } catch (err) {
    await conn.rollback();

    res.status(500).json({
      success: false,
      message: "Error al actualizar empleado",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});

// PUT: para inactivar (SOFT DELETE)
router.put("/inactivar/:id", async (req, res) => {
  try {
    const id = req.params.id;

    //validar préstamos activos
    const [rows] = await db.query(
      `SELECT COUNT(*) as total
       FROM prestamos
       WHERE id_persona = ? AND estado_prestamo = 'EN_CURSO'`,
      [id],
    );

    if (rows[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede inactivar: tiene préstamos activos",
      });
    }

    await db.query(
      "UPDATE personas SET estado = 'INACTIVO' WHERE id_persona = ?",
      [id],
    );

    res.json({
      success: true,
      message: "Empleado inactivado correctamente",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al inactivar empleado",
      error: err.message,
    });
  }
});

module.exports = router;
