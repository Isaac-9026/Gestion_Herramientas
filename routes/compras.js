const express = require("express");
const router = express.Router();
const db = require("../config/db");

/*get /opciones  para provedores y productos activos para llenar selects */
router.get("/opciones", async (req, res) => {
  try {
    const [proveedores] = await db.query(`
      SELECT id_proveedor, razon_social
      FROM proveedores
      WHERE estado = 'ACTIVO'
      ORDER BY razon_social ASC
    `);

    const [productos] = await db.query(`
      SELECT id_producto, nombre, modelo
      FROM productos
      WHERE estado = 'ACTIVO'
      ORDER BY nombre ASC
    `);

    res.json({
      success: true,
      data: {
        proveedores,
        productos,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener opciones de compras",
      error: err.message,
    });
  }
});

//  Historial de compras
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id_compra,
        c.num_factura,
        c.total_compra,
        DATE_FORMAT(c.fecha_compra, '%d/%m/%Y %H:%i') AS fecha_formateada,
        p.razon_social,
        COALESCE(u.username, '—') AS username,
        COUNT(dc.id_detalle_compra) AS total_items
      FROM compras c
      INNER JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      LEFT JOIN detalle_compra dc ON c.id_compra = dc.id_compra
      GROUP BY
        c.id_compra,
        c.num_factura,
        c.total_compra,
        c.fecha_compra,
        p.razon_social,
        u.username
      ORDER BY c.id_compra DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener compras",
      error: err.message,
    });
  }
});

//Detalle de una compra
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [compra] = await db.query(
      `
      SELECT
        c.id_compra,
        c.num_factura,
        c.total_compra,
        DATE_FORMAT(c.fecha_compra, '%d/%m/%Y %H:%i') AS fecha_formateada,
        p.razon_social,
        COALESCE(u.username, '—') AS username
      FROM compras c
      INNER JOIN proveedores p ON c.id_proveedor = p.id_proveedor
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE c.id_compra = ?
    `,
      [id],
    );

    if (compra.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Compra no encontrada",
      });
    }

    const [detalle] = await db.query(
      `
      SELECT
        dc.id_detalle_compra,
        dc.id_producto,
        dc.cantidad,
        dc.precio_unitario,
        (dc.cantidad * dc.precio_unitario) AS subtotal,
        pr.nombre,
        pr.modelo
      FROM detalle_compra dc
      INNER JOIN productos pr ON dc.id_producto = pr.id_producto
      WHERE dc.id_compra = ?
      ORDER BY dc.id_detalle_compra ASC
    `,
      [id],
    );

    res.json({
      success: true,
      data: {
        compra: compra[0],
        detalle,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener detalle de compra",
      error: err.message,
    });
  }
});

//Registro maestro-detalle con transacción
router.post("/", async (req, res) => {
  const conn = await db.getConnection();

  try {
    const { num_factura, id_proveedor, detalles } = req.body;

    if (!num_factura || num_factura.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El número de factura es obligatorio",
      });
    }

    if (!id_proveedor) {
      return res.status(400).json({
        success: false,
        message: "El proveedor es obligatorio",
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debe agregar al menos un detalle",
      });
    }

    // Calcular total en servidor
    const totalCalculado = detalles.reduce((sum, item) => {
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precio_unitario || 0);
      return sum + cantidad * precio;
    }, 0);

    await conn.beginTransaction();

    // validar proveedor activo
    const [proveedorOk] = await conn.query(
      `SELECT id_proveedor
       FROM proveedores
       WHERE id_proveedor = ? AND estado = 'ACTIVO'`,
      [id_proveedor],
    );

    if (proveedorOk.length === 0) {
      throw new Error("Proveedor no existe o está inactivo");
    }

    //insertar compra
    const [compraResult] = await conn.query(
      `INSERT INTO compras (num_factura, total_compra, id_proveedor, id_usuario)
       VALUES (?, ?, ?, ?)`,
      [num_factura.trim(), totalCalculado, id_proveedor, 1], //temporalmente idusuario = 1
    );

    const id_compra = compraResult.insertId;

    //insertar detalle
    for (const item of detalles) {
      const id_producto = Number(item.id_producto);
      const cantidad = Number(item.cantidad);
      const precio_unitario = Number(item.precio_unitario);

      if (!id_producto || !cantidad || !precio_unitario) {
        throw new Error(
          "Detalle inválido. Verifique producto, cantidad y precio.",
        );
      }

      if (cantidad <= 0 || precio_unitario <= 0) {
        throw new Error("Cantidad y precio deben ser mayores a cero");
      }

      //validar producto activo
      const [productoOk] = await conn.query(
        `SELECT id_producto
         FROM productos
         WHERE id_producto = ? AND estado = 'ACTIVO'`,
        [id_producto],
      );

      if (productoOk.length === 0) {
        throw new Error(`El producto ${id_producto} no existe o está inactivo`);
      }

      await conn.query(
        `INSERT INTO detalle_compra (id_compra, id_producto, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
        [id_compra, id_producto, cantidad, precio_unitario],
      );
    }

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Compra registrada correctamente",
      id_compra,
      total_compra: totalCalculado,
    });
  } catch (err) {
    await conn.rollback();

    res.status(500).json({
      success: false,
      message: "Error al registrar compra",
      error: err.message,
    });
  } finally {
    conn.release();
  }
});

module.exports = router;
