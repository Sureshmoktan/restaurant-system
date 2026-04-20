const express = require("express");
const router = express.Router();


const {
  getAllMenu,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require("../controllers/menuController");

const protect = require("../middlewares/authMiddleware");
const restrictTo = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const ROLES = require("../constants/roles");


// router.get("/", getAllMenu);
// router.get("/:id", getMenuItem);
// router.post("/", protect, restrictTo(ROLES.ADMIN), upload.single("image"), createMenuItem);
// router.put("/:id", protect, restrictTo(ROLES.ADMIN), upload.single("image"), updateMenuItem);
// router.delete("/:id", protect, restrictTo(ROLES.ADMIN), deleteMenuItem);
// router.patch("/:id/availability", protect, restrictTo(ROLES.ADMIN), toggleAvailability);



router.get("/", getAllMenu);
router.get("/:id", getMenuItem);
router.post("/", protect, restrictTo("admin"), upload.single("image"), createMenuItem);
router.put("/:id", protect, restrictTo("admin"), upload.single("image"), updateMenuItem);
router.delete("/:id", protect, restrictTo("admin"), deleteMenuItem);
router.patch("/:id/availability", protect, restrictTo("admin"), toggleAvailability);

module.exports = router;