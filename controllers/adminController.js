const adminModel = require("../models/adminModel");
const bcrypt = require("bcrypt");

// Create and register a new admin
exports.registerAdminController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Please fill all fields",
      });
    }

    // Check if email already exists
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).send({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new admin
    const admin = new adminModel({ username, email, password: hashedPassword });
    await admin.save();

    return res.status(201).send({
      success: true,
      message: "New admin created",
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};

// Fetch all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.find({});
    return res.status(200).send({
      success: true,
      message: "All admins",
      admins,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error fetching admins",
      error,
    });
  }
};

// Admin login
exports.loginAdminController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).send({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Login successful",
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error logging in",
      error,
    });
  }
};
