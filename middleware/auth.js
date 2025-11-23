const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];

    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );

    
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }

    return res.status(400).json({ message: "Invalid token." });
  }
};
