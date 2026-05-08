const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {

    const authHeader = req.headers.authorization || "";

    const tokenQuery = req.query.token;

    const tokenHeader =
      authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = tokenQuery || tokenHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No autorizado",
      });
    }

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

module.exports = authMiddleware;