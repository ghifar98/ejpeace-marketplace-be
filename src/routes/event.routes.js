const express = require("express");
const router = express.Router();

// Import controllers
const eventController = require("../controllers/event.controller");

// Import middleware
const {
  authenticate,
  authorizeAdmin,
} = require("../middleware/auth.middleware");
const {
  createFlexibleUpload,
  handleMultipleFieldNames,
  handleUploadError,
} = require("../middleware/upload.middleware");
const {
  compressUploadedImages,
} = require("../middleware/compression.middleware");

// Create flexible upload middleware
const upload = createFlexibleUpload();

// Public routes
router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);

// Protected routes (admin only)
router.post(
  "/",
  authenticate,
  authorizeAdmin,
  upload.any(), // Use any() to accept any field name
  handleMultipleFieldNames,
  handleUploadError,
  compressUploadedImages, // Compress images before saving
  eventController.createEvent
);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  upload.any(), // Use any() to accept any field name
  handleMultipleFieldNames,
  handleUploadError,
  compressUploadedImages, // Compress images before saving
  eventController.updateEvent
);
router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  eventController.deleteEvent
);

// Delete individual event image
router.delete(
  "/:eventId/images/:imageId",
  authenticate,
  authorizeAdmin,
  eventController.deleteEventImage
);

module.exports = router;
