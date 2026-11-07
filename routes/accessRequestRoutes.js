
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
    createAccessRequest,
    getAccessRequests,
    updateAccessRequestStatus
} = require("../controllers/accessRequestController");


// Public Route: Submit Access Request
router.post("/", createAccessRequest);


// Admin Route: Get All Access Requests
router.get("/", authMiddleware, adminMiddleware, getAccessRequests);


// Admin Route: Update Access Request Status
router.put("/:id", authMiddleware, adminMiddleware, updateAccessRequestStatus);


module.exports = router;
