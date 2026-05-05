require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");
const createCatalogRouter = require("./routes/catalogoBase");

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/api/test", (req, res) => {
  res.json({ ok: true, source: "backend real funcionando" });
});
// ─────────────────────────────
// MIDDLEWARES
// ─────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────
// APIs PRIMERO (OBLIGATORIO)
// ─────────────────────────────
app.use("/api/herramientas", require("./routes/herramientas"));
app.use("/api/productos", require("./routes/productos"));
app.use("/api/compras", require("./routes/compras"));
app.use("/api/prestamos", require("./routes/prestamos"));
app.use("/api/personas", require("./routes/personas"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/proveedores", require("./routes/proveedores"));
app.use("/api/empleados", require("./routes/empleados"));
app.use('/api/auth', require('./routes/auth'));
app.use(
  "/api/categorias",
  createCatalogRouter({
    table: "categorias",
    idField: "id_categoria",
    label: "Categoría",
  }),
);

app.use(
  "/api/marcas",
  createCatalogRouter({
    table: "marcas",
    idField: "id_marca",
    label: "Marca",
  }),
);

app.use(
  "/api/ubicaciones",
  createCatalogRouter({
    table: "ubicaciones",
    idField: "id_ubicacion",
    label: "Ubicación",
  }),
);

app.use(
  "/api/areas",
  createCatalogRouter({
    table: "areas",
    idField: "id_area",
    label: "Área",
  }),
);

app.use(
  "/api/roles",
  createCatalogRouter({
    table: "roles",
    idField: "id_rol",
    label: "Rol",
  }),
);

// ─────────────────────────────
// STATIC DESPUÉS
// ─────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────
// SPA FALLBACK (NO TOCAR /api)
// ─────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────
// DB CHECK
// ─────────────────────────────
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Conectado a MySQL");
    conn.release();
  } catch (err) {
    console.error("Error de conexión:", err.message);
  }
})();

// ─────────────────────────────
// ERROR HANDLER
// ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
