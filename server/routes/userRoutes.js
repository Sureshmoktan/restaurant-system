const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  deleteUser,
} = require("../controllers/userController");
const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");
const ROLES = require("../constants/roles");

// All routes are admin only
router.use(protect);
router.use(restrictTo(ROLES.ADMIN));

router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deactivateUser);
router.delete("/:id/permanent", deleteUser);

module.exports = router;