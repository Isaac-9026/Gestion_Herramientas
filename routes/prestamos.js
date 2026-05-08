const express = require("express");
const router = express.Router();
const db = require("../config/db");
const PDFDocument = require("pdfkit");
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);

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
      error: err.message,
    });
  }
});

//buscar prestamo x id y detalles
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [prestamo] = await db.query(
      `
      SELECT 
        p.*, 
        per.nombres, 
        u.username AS despachador
      FROM prestamos p
      JOIN personas per ON p.id_persona = per.id_persona
      JOIN usuarios u ON p.id_usuario_despachador = u.id_usuario
      WHERE p.id_prestamo = ?
    `,
      [id],
    );

    if (prestamo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Préstamo no encontrado",
      });
    }

    const [detalle] = await db.query(
      `
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
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        prestamo: prestamo[0],
        detalle,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener préstamo",
      error: err.message,
    });
  }
});

//OBTNER REPORTE PDF
router.get("/:id/pdf", async (req, res) => {

  try {

    const id = req.params.id;

    // PRÉSTAMO
    const [prestamoRows] = await db.query(`
      SELECT
        p.id_prestamo,
        p.fecha_salida,
        p.fecha_limite,
        p.motivo,
        p.estado_prestamo,

        per.nombres AS persona,
        per.dni,

        u.username,
        perUser.nombres AS despachador

      FROM prestamos p

      INNER JOIN personas per
        ON p.id_persona = per.id_persona

      INNER JOIN usuarios u
        ON p.id_usuario_despachador = u.id_usuario

      INNER JOIN personas perUser
        ON u.id_persona = perUser.id_persona

      WHERE p.id_prestamo = ?
    `, [id]);

    if (prestamoRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Préstamo no encontrado"
      });
    }

    const prestamo = prestamoRows[0];

    // DETALLE
    const [detalle] = await db.query(`
      SELECT
        h.codigo_inventario,
        pr.nombre AS producto,
        dp.estado_entrega
      FROM detalle_prestamo dp

      INNER JOIN herramientas h
        ON dp.id_herramienta = h.id_herramienta

      INNER JOIN productos pr
        ON h.id_producto = pr.id_producto

      WHERE dp.id_prestamo = ?
    `, [id]);

    //PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4"
    });

    //headers
    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename=prestamo-${id}.pdf`
    );

    doc.pipe(res);

    //TITULO
    doc
      .fontSize(20)
      .text("COMPROBANTE DE PRÉSTAMO", {
        align: "center"
      });

    doc.moveDown(2);

    // DATOS
    doc
      .fontSize(11)
      .text(`Folio: PR-${String(prestamo.id_prestamo).padStart(5, "0")}`);

    doc.text(`Fecha préstamo: ${
      new Date(prestamo.fecha_salida).toLocaleString()
    }`);

    doc.text(`Fecha límite: ${
      prestamo.fecha_limite
        ? new Date(prestamo.fecha_limite).toLocaleDateString()
        : "-"
    }`);

    doc.moveDown();

    doc.text(`Empleado: ${prestamo.persona}`);
    doc.text(`DNI: ${prestamo.dni || "-"}`);

    doc.moveDown();

    doc.text(`Despachador: ${prestamo.despachador}`);
    doc.text(`Usuario sistema: ${prestamo.username}`);

    doc.moveDown();

    doc.text(`Motivo: ${prestamo.motivo || "-"}`);

    doc.moveDown(2);

    // TABLA
    doc
      .fontSize(13)
      .text("Herramientas entregadas");

    doc.moveDown();

    const tableTop = doc.y;

    doc.fontSize(10);

    doc.text("#", 50, tableTop);
    doc.text("Código", 90, tableTop);
    doc.text("Herramienta", 220, tableTop);
    doc.text("Estado", 450, tableTop);

    let y = tableTop + 25;

    detalle.forEach((item, index) => {

      doc.text(index + 1, 50, y);

      doc.text(item.codigo_inventario, 90, y);

      doc.text(item.producto, 220, y, {
        width: 200
      });

      doc.text(item.estado_entrega, 450, y);

      y += 25;
    });

    // línea
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    y += 60;

    // FIRMAS
    doc.text(
      "________________________",
      70,
      y
    );

    doc.text(
      "Firma Responsable",
      95,
      y + 20
    );

    doc.text(
      "________________________",
      330,
      y
    );

    doc.text(
      "Firma Despachador",
      355,
      y + 20
    );

    //footer
    doc.moveDown(6);

    doc
      .fontSize(9)
      .fillColor("gray")
      .text(
        "Documento generado automáticamente por el Sistema",
        {
          align: "center"
        }
      );

    doc.end();

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Error al generar PDF",
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
      motivo,
      herramientas,
      fecha_limite,
    } = req.body;
    
    //obtener usuario desde token
    const id_usuario_despachador = req.user.id_usuario;

    if (!herramientas || herramientas.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe incluir herramientas",
      });
    }

    await connection.beginTransaction();

    const [prestamoResult] = await connection.query(
      `INSERT INTO prestamos (id_persona, id_usuario_despachador, motivo, fecha_limite)
       VALUES (?, ?, ?, ?)`,
      [id_persona, id_usuario_despachador, motivo, fecha_limite],
    );

    const id_prestamo = prestamoResult.insertId;

    //Detalle
    for (const id_herramienta of herramientas) {
      const [rows] = await connection.query(
        "SELECT disponible FROM herramientas WHERE id_herramienta = ?",
        [id_herramienta],
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
        [id_prestamo, id_herramienta],
      );

      await connection.query(
        "UPDATE herramientas SET disponible = FALSE WHERE id_herramienta = ?",
        [id_herramienta],
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Préstamo creado correctamente",
      id_prestamo,
    });
  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error al crear préstamo",
      error: err.message,
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
      [req.params.id_detalle],
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
      [
        estado_devolucion,
        observaciones,
        id_usuario_receptor,
        req.params.id_detalle,
      ],
    );

    //se libera la herramienta
    await connection.query(
      `UPDATE herramientas 
   SET disponible = TRUE, 
       estado = ?
   WHERE id_herramienta = ?`,
      [estado_devolucion, id_herramienta],
    );

    //Ccomprobar si fue devuelto
    const [pendientes] = await connection.query(
      `SELECT COUNT(*) as total
       FROM detalle_prestamo
       WHERE id_prestamo = ? AND fecha_devolucion IS NULL`,
      [id_prestamo],
    );

    if (pendientes[0].total === 0) {
      await connection.query(
        "UPDATE prestamos SET estado_prestamo = 'CERRADO' WHERE id_prestamo = ?",
        [id_prestamo],
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Devolución registrada correctamente",
    });
  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error en devolución",
      error: err.message,
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
      [req.params.id],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Préstamo no existe",
      });
    }

    if (rows[0].estado_prestamo === "EN_CURSO") {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar un préstamo activo",
      });
    }

    await db.query("DELETE FROM detalle_prestamo WHERE id_prestamo = ?", [
      req.params.id,
    ]);
    await db.query("DELETE FROM prestamos WHERE id_prestamo = ?", [
      req.params.id,
    ]);

    res.json({
      success: true,
      message: "Préstamo eliminado correctamente",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar préstamo",
      error: err.message,
    });
  }
});

module.exports = router;
