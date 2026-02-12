const express = require("express");
const router = express.Router();

const {
    registerAdmin,
    login,
    createStaff,
    getAllUsers,
    deleteUser
} = require("../controllers/auth");

const { auth, authorizeRoles } = require("../middleware/authentication");

router.post("/register-admin", registerAdmin);
router.post("/login", login);

router.post("/create-staff", auth, authorizeRoles("ADMIN"), createStaff);
router.get("/users", auth, authorizeRoles("ADMIN"), getAllUsers);
router.delete("/user/:id", auth, authorizeRoles("ADMIN"), deleteUser);

module.exports = router;