const express = require("express");
const router = express.Router();
const db = require("../config/db");

//obtner todos los prestamos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        per.nombres,
        u.username,
      COUNT(dp.id_detalle_prestamo) AS total_items,
      MIN(dp.fecha_devolucion) IS NULL AS en_curso
      FROM prestamos p
      JOIN personas per ON p.id_persona = per.id_persona
      JOIN usuarios u ON p.id_usuario_despachador = u.id_usuario
      LEFT JOIN detalle_prestamo dp ON p.id_prestamo = dp.id_prestamo
      GROUP BY p.id_prestamo
      ORDER BY p.id_prestamo DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener préstamos",
      error: err.message
    });
  }
});


//buscar prestamo x id y detalles
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [prestamo] = await db.query(
      "SELECT * FROM prestamos WHERE id_prestamo = ?",
      [id]
    );

    if (prestamo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Préstamo no encontrado"
      });
    }

    const [detalle] = await db.query(`
      SELECT 
        dp.id_detalle_prestamo,
        dp.estado_entrega,
        dp.estado_devolucion,
        dp.fecha_devolucion,
        dp.observaciones,

        h.codigo_inventario,
        pr.nombre AS producto,

        u.username AS usuario_receptor

      FROM detalle_prestamo dp
    JOIN herramientas h ON dp.id_herramienta = h.id_herramienta
    JOIN productos pr ON h.id_producto = pr.id_producto
    LEFT JOIN usuarios u ON dp.id_usuario_receptor = u.id_usuario
    WHERE dp.id_prestamo = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        prestamo: prestamo[0],
        detalle
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener préstamo",
      error: err.message
    });
  }
});


//para crear el prestamo
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const {
      id_persona,
      id_usuario_despachador,
      motivo,
      herramientas
    } = req.body;

    if (!herramientas || herramientas.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe incluir herramientas"
      });
    }

    await connection.beginTransaction();

    const [prestamoResult] = await connection.query(
      `INSERT INTO prestamos (id_persona, id_usuario_despachador, motivo)
       VALUES (?, ?, ?)`,
      [id_persona, id_usuario_despachador, motivo]
    );

    const id_prestamo = prestamoResult.insertId;

    //Detalle
    for (const id_herramienta of herramientas) {

      const [rows] = await connection.query(
        "SELECT disponible FROM herramientas WHERE id_herramienta = ?",
        [id_herramienta]
      );

      if (rows.length === 0) {
        throw new Error(`Herramienta ${id_herramienta} no existe`);
      }

      if (!rows[0].disponible) {
        throw new Error(`Herramienta ${id_herramienta} no disponible`);
      }

      await connection.query(
        `INSERT INTO detalle_prestamo 
        (id_prestamo, id_herramienta, estado_entrega)
        VALUES (?, ?, 'BUENO')`,
        [id_prestamo, id_herramienta]
      );

      await connection.query(
        "UPDATE herramientas SET disponible = FALSE WHERE id_herramienta = ?",
        [id_herramienta]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Préstamo creado correctamente",
      id_prestamo
    });

  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error al crear préstamo",
      error: err.message
    });

  } finally {
    connection.release();
  }
});


//put --- para actualizar y registrar devoluciones exactamente
router.put("/devolver/:id_detalle", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { estado_devolucion, observaciones, id_usuario_receptor } = req.body;

    await connection.beginTransaction();

    //Obtener herramienta
    const [detalle] = await connection.query(
      "SELECT id_herramienta, id_prestamo FROM detalle_prestamo WHERE id_detalle_prestamo = ?",
      [req.params.id_detalle]
    );

    if (detalle.length === 0) {
      throw new Error("Detalle no encontrado");
    }

    const { id_herramienta, id_prestamo } = detalle[0];

    //actualizar detalle
    await connection.query(
      `UPDATE detalle_prestamo
       SET estado_devolucion = ?, 
           fecha_devolucion = NOW(),
           observaciones = ?,
           id_usuario_receptor = ?
       WHERE id_detalle_prestamo = ?`,
      [estado_devolucion, observaciones, id_usuario_receptor, req.params.id_detalle]
    );

    //se libera la herramienta
    await connection.query(
      "UPDATE herramientas SET disponible = TRUE WHERE id_herramienta = ?",
      [id_herramienta]
    );

    //Ccomprobar si fue devuelto
    const [pendientes] = await connection.query(
      `SELECT COUNT(*) as total
       FROM detalle_prestamo
       WHERE id_prestamo = ? AND fecha_devolucion IS NULL`,
      [id_prestamo]
    );

    if (pendientes[0].total === 0) {
      await connection.query(
        "UPDATE prestamos SET estado_prestamo = 'CERRADO' WHERE id_prestamo = ?",
        [id_prestamo]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Devolución registrada correctamente"
    });

  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error en devolución",
      error: err.message
    });

  } finally {
    connection.release();
  }
});


//eliminar
router.delete("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT estado_prestamo FROM prestamos WHERE id_prestamo = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Préstamo no existe"
      });
    }

    if (rows[0].estado_prestamo === 'EN_CURSO') {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar un préstamo activo"
      });
    }

    await db.query("DELETE FROM detalle_prestamo WHERE id_prestamo = ?", [req.params.id]);
    await db.query("DELETE FROM prestamos WHERE id_prestamo = ?", [req.params.id]);

    res.json({
      success: true,
      message: "Préstamo eliminado correctamente"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar préstamo",
      error: err.message
    });
  }
});

module.exports = router;