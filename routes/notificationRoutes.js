const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// GET ALL NOTIFICATIONS
router.get("/", authMiddleware, async (req, res) => {
    try {
        console.log("LOGGED IN USER ID:", req.user._id);
        console.log("LOGGED IN USER ROLE:", req.user.role);

        const notifications = await Notification.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        console.log("NOTIFICATIONS FOUND:", notifications.length);
        console.log("NOTIFICATION DATA:", notifications);

        res.status(200).json(notifications);

    } catch (error) {
        console.error("NOTIFICATION FETCH ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
});


// MARK NOTIFICATION AS READ
router.put("/:id/read", authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;