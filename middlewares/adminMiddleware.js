const JWT = require("jsonwebtoken");
const Admin = require("../models/adminModel");

const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.auth = decoded;

    // Check if the user is an admin
    const admin = await Admin.findById(decoded._id);
    if (!admin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized access" });
  }
};

module.exports = { requireAdmin };
