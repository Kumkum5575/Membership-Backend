const AccessRequest = require("../models/AccessRequest");
const User = require("../models/User");
const Notification = require("../models/Notification");

// 1. Submit Access Request
const createAccessRequest = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Check required fields
        if (!name || !email) {
            return res.status(400).json({
                message: "Please enter name and email"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check valid email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }

        // Check existing pending request
        const existingRequest = await AccessRequest.findOne({
            email: normalizedEmail,
            status: "PENDING"
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "Your access request is already submitted"
            });
        }

        // Create access request
        const accessRequest = await AccessRequest.create({
            name: name.trim(),
            email: normalizedEmail
        });

        console.log("ACCESS REQUEST CONTROLLER HIT");

        // Find all admin users
        const admins = await User.find({
            role: "admin"
        }).select("_id");

        console.log("ADMINS FOUND:", admins.length);
        console.log("ADMIN IDS:", admins);

        // Create notifications for all admins
        if (admins.length > 0) {

            const adminNotifications = admins.map((admin) => ({
                user: admin._id,
                message: `New access request received from ${name.trim()} (${normalizedEmail}).`
            }));

            const result = await Notification.insertMany(
                adminNotifications
            );

            console.log("NOTIFICATIONS CREATED:", result.length);

        } else {
            console.log("NO ADMIN FOUND");
        }

        return res.status(201).json({
            message: "Access request submitted successfully",
            accessRequest
        });

    } catch (error) {
        console.error("ACCESS REQUEST ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// 2. Get All Access Requests (Admin)
const getAccessRequests = async (req, res) => {
    try {
        const requests = await AccessRequest.find().sort({
            createdAt: -1
        });

        return res.status(200).json({
            message: "Access requests fetched successfully",
            requests
        });

    } catch (error) {
        console.error("GET ACCESS REQUESTS ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// 3. Update Access Request Status (Admin)
const updateAccessRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["PENDING", "REVIEWED", "CLOSED"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const request = await AccessRequest.findByIdAndUpdate(
            req.params.id,
            { status },
            {
                new: true,
                runValidators: true
            }
        );

        if (!request) {
            return res.status(404).json({
                message: "Access request not found"
            });
        }

        return res.status(200).json({
            message: "Access request status updated successfully",
            request
        });

    } catch (error) {
        console.error("UPDATE ACCESS REQUEST ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Export controllers
module.exports = {
    createAccessRequest,
    getAccessRequests,
    updateAccessRequestStatus
};