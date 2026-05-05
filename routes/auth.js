const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "El usuario es obligatorio",
      });
    }

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La contraseña es obligatoria",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        u.id_usuario,
        u.id_persona,
        u.username,
        u.password_hash,
        u.id_rol,
        u.activo,
        p.nombres,
        p.estado AS estado_persona,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN personas p ON u.id_persona = p.id_persona
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: "El usuario está inactivo",
      });
    }

    if (user.estado_persona && user.estado_persona !== "ACTIVO") {
      return res.status(403).json({
        success: false,
        message: "La persona asociada al usuario está inactiva",
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_persona: user.id_persona,
        username: user.username,
        id_rol: user.id_rol,
        nombres: user.nombres,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Login correcto",
      token,
      user: {
        id_usuario: user.id_usuario,
        id_persona: user.id_persona,
        username: user.username,
        nombres: user.nombres,
        id_rol: user.id_rol,
        rol: user.rol,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: err.message,
    });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token no enviado",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}

module.exports = router;
module.exports.authMiddleware = authMiddleware;