const express = require("express");
const router = express.Router();
const db = require("../config/db");

//get para todas las compras
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, p.razon_social AS proveedor, u.username AS usuario
      FROM compras c
      LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      ORDER BY c.id_compra DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener compras",
      error: err.message
    });
  }
});



//get compra x id y detalle
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [compra] = await db.query(
      "SELECT * FROM compras WHERE id_compra = ?",
      [id]
    );

    if (compra.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada"
      });
    }

    //detalle + producto
    const [detalle] = await db.query(`
      SELECT dc.*, pr.nombre, pr.modelo
      FROM detalle_compra dc
      JOIN productos pr ON dc.id_producto = pr.id_producto
      WHERE dc.id_compra = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        compra: compra[0],
        detalle
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener compra",
      error: err.message
    });
  }
});


//post para registrar coompras y generar herramientas
router.post("/", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { num_factura, id_proveedor, id_usuario, detalles } = req.body;

    //validacion basica
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe incluir detalles"
      });
    }

    await connection.beginTransaction();

    // insertar compra
    const [compraResult] = await connection.query(
      `INSERT INTO compras (num_factura, id_proveedor, id_usuario)
       VALUES (?, ?, ?)`,
      [num_factura, id_proveedor, id_usuario]
    );

    const id_compra = compraResult.insertId;

    //insertar detalles + generar herramientas
    for (const item of detalles) {
      const { id_producto, cantidad, precio_unitario } = item;

      //insertar detalle
      const [detalleResult] = await connection.query(
        `INSERT INTO detalle_compra 
        (id_compra, id_producto, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)`,
        [id_compra, id_producto, cantidad, precio_unitario]
      );

      const id_detalle = detalleResult.insertId;

      //generar herramientas automaticamente
      for (let i = 0; i < cantidad; i++) {
        const codigo = `AUTO-${id_producto}-${Date.now()}-${i}`;

        await connection.query(
          `INSERT INTO herramientas 
          (id_producto, id_detalle_compra, codigo_inventario, estado, disponible)
          VALUES (?, ?, ?, 'BUENO', TRUE)`,
          [id_producto, id_detalle, codigo]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Compra registrada correctamente",
      id_compra
    });

  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error al registrar compra",
      error: err.message
    });

  } finally {
    connection.release();
  }
});


//actualizar
router.put("/:id", async (req, res) => {
  try {
    const { num_factura, id_proveedor } = req.body;

    const [result] = await db.query(
      `UPDATE compras 
       SET num_factura = ?, id_proveedor = ?
       WHERE id_compra = ?`,
      [num_factura, id_proveedor, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada"
      });
    }

    res.json({
      success: true,
      message: "Compra actualizada (solo cabecera)"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar compra",
      error: err.message
    });
  }
});


router.delete("/:id", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    //validar si tiene herramientas generadas
    const [tools] = await connection.query(
      `SELECT COUNT(*) as total 
       FROM herramientas h
       JOIN detalle_compra dc ON h.id_detalle_compra = dc.id_detalle_compra
       WHERE dc.id_compra = ?`,
      [req.params.id]
    );

    if (tools[0].total > 0) {
      return res.status(409).json({
        success: false,
        message: "No se puede eliminar, ya generó herramientas"
      });
    }

    //eliminar detalle
    await connection.query(
      "DELETE FROM detalle_compra WHERE id_compra = ?",
      [req.params.id]
    );

    //delete compra
    const [result] = await connection.query(
      "DELETE FROM compras WHERE id_compra = ?",
      [req.params.id]
    );

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada"
      });
    }

    res.json({
      success: true,
      message: "Compra eliminada correctamente"
    });

  } catch (err) {
    await connection.rollback();

    res.status(500).json({
      success: false,
      message: "Error al eliminar compra",
      error: err.message
    });

  } finally {
    connection.release();
  }
});

module.exports = router;