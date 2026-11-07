const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET ALL AUDIT LOGS
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate("admin", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json(logs);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;