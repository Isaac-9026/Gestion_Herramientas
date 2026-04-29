require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/herramientas', require('./routes/herramientas'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/compras', require('./routes/compras'));
app.use('/api/prestamos', require('./routes/prestamos'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/proveedores', require('./routes/proveedores'));

//DB conexión
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Conectado a MySQL");
    conn.release();
  } catch (err) {
    console.error("Error de conexión:", err.message);
  }
})();

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Error handler 
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});