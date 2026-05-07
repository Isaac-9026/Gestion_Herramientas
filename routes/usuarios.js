const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middlewares/auth.middleware");
router.use(authMiddleware);


//listar a los usuarios registrados
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.username, u.activo, u.created_at,
              p.nombres, r.nombre AS rol
       FROM usuarios u
       LEFT JOIN personas p ON u.id_persona = p.id_persona
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       ORDER BY u.id_usuario DESC`
    );

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: err.message,
    });
  }
});

//buscar usuario x id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, p.nombres, r.nombre AS rol
       FROM usuarios u
       LEFT JOIN personas p ON u.id_persona = p.id_persona
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al buscar usuario",
      error: err.message,
    });
  }
});

//Crear usuario
router.post("/", async (req, res) => {
  try {
    const { id_persona, username, password, id_rol } = req.body;

    if (!id_persona || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "id_persona, username y password son obligatorios",
      });
    }

    //validar si el el nombre de usuario esta duplicado
    const [existeUser] = await db.query(
      "SELECT id_usuario FROM usuarios WHERE username = ?",
      [username]
    );

    if (existeUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El username ya está en uso",
      });
    }

    //para validar si la  persona ya esta registrada como usuario
    const [existePersona] = await db.query(
      "SELECT id_usuario FROM usuarios WHERE id_persona = ?",
      [id_persona]
    );

    if (existePersona.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Esta persona ya tiene un usuario",
      });
    }

    //hash de password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [result] = await db.query(
      `INSERT INTO usuarios (id_persona, username, password_hash, id_rol)
       VALUES (?, ?, ?, ?)`,
      [id_persona, username, password_hash, id_rol || null]
    );

    res.status(201).json({
      success: true,
      message: "Usuario creado correctamente",
      id: result.insertId,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al crear usuario",
      error: err.message,
    });
  }
});


//Solo actualizar el usuario ..
router.put("/:id", async (req, res) => {
  try {
    const { username, id_rol, activo } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "El username es obligatorio",
      });
    }

    //validar duplicados
    const [existe] = await db.query(
      "SELECT id_usuario FROM usuarios WHERE username = ? AND id_usuario != ?",
      [username, req.params.id]
    );

    if (existe.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El username ya está en uso",
      });
    }

    const [result] = await db.query(
      `UPDATE usuarios
       SET username = ?, id_rol = ?, activo = ?
       WHERE id_usuario = ?`,
      [username, id_rol || null, activo ?? true, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario actualizado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario",
      error: err.message,
    });
  }
});

//para cambiar la contraseña
router.put("/password/:id", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "La contraseña es obligatoria",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?",
      [password_hash, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar contraseña",
      error: err.message,
    });
  }
});


//Eliminar usuario (esto seria opcional, ya que lo mejor es que se le puede desactivar)
 
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM usuarios WHERE id_usuario = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario",
      error: err.message,
    });
  }
});

module.exports = router;