const express = require("express");
const router = express.Router();
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  toggleOccupied,
} = require("../controllers/tableController");
const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");
const ROLES = require("../constants/roles");

// Public routes - no login required
router.get("/", getAllTables);

// All routes below require login
router.use(protect);

router.get("/:id", getTableById);
router.post("/", restrictTo(ROLES.ADMIN), createTable);
router.put("/:id", restrictTo(ROLES.ADMIN), updateTable);
router.delete("/:id", restrictTo(ROLES.ADMIN), deleteTable);
router.patch("/:id/toggle", restrictTo(ROLES.ADMIN), toggleOccupied);

module.exports = router;