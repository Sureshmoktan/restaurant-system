const express = require("express");
const router = express.Router();
const { login, refresh, logout, getMe } = require("../controllers/authController");
// console.log({ login, refresh, logout, getMe }); // ← fix this line

const protect = require("../middlewares/authMiddleware");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;