const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await User.findOne({
      role: { $regex: /^admin$/i }
    });

    if (adminExists) {
      return res.status(400).json({ msg: "Admin already exists. Only one admin allowed." });
    }

    // Creating the master admin
    const user = await User.create({ name, email, password, role: "ADMIN" });

    // JWT Generation
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_LIFETIME || "1d" }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role.toLowerCase()
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ msg: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_LIFETIME || "1d" }
    );

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        role: user.role.toLowerCase()
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (role.toUpperCase() === "ADMIN") {
      return res.status(400).json({ msg: "Cannot create another Admin account." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: "User with this email already exists." });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: role.toUpperCase()
    });

    res.status(201).json({
      msg: `${role} created successfully`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.toLowerCase()
      }
    });
  } catch (error) {
    next(error);
  }
};

// ✅ GET ALL USERS (Admin View)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: "ADMIN" } }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// ✅ DELETE USER
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);
    if (!userToDelete || userToDelete.role === "ADMIN") {
      return res.status(400).json({ msg: "Invalid request. Admin cannot be deleted." });
    }

    await User.findByIdAndDelete(id);
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};