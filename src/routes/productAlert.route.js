const express = require("express");
const router = express.Router();
const productAlertController = require("../controllers/productAlert.controller");
const { authenticateToken, isAdmin, authenticate } = require("../middleware/auth.middleware");

// Public routes (read-only) - assuming alerts might be fetched publicly for some reason, 
// but usually fetching product includes alerts. 
// List alerts might be useful for frontend dropdowns.
router.get("/", productAlertController.getAllAlerts);
router.get("/:id", productAlertController.getAlertById);
// router.use(authenticateToken);
// // Admin routes (CRUD)
router.post("/", authenticate, productAlertController.createAlert);
router.put("/:id", authenticate, productAlertController.updateAlert);
router.delete("/:id", authenticate, productAlertController.deleteAlert);

module.exports = router;
