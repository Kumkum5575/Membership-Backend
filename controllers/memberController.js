const crypto = require("crypto");
const Application = require("../models/Application");
const Invitation = require("../models/Invitation");

// MEMBER DASHBOARD
const getDashboard = async (req, res) => {
    try {
        res.status(200).json({
            message: "Welcome to Member Dashboard",
            user: {
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GET MY APPLICATION
const getMyApplication = async (req, res) => {
    try {
        const application = await Application.findOne({
            user: req.user._id
        }).populate("invitation", "code expiresAt");

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        res.status(200).json({
            application
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// GENERATE INVITATION
const generateInvitation = async (req, res) => {
    try {
        // CHECK INVITATION GENERATION PERMISSION
        if (!req.user.canGenerateInvitations) {
            return res.status(403).json({
                message: "You do not have permission to generate invitations."
            });
        }

        // CHECK MEMBER INVITATION QUOTA
        const totalInvitations = await Invitation.countDocuments({
            createdBy: req.user._id
        });

        if (totalInvitations >= req.user.invitationQuota) {
            return res.status(403).json({
                message: "Your invitation quota has been reached."
            });
        }

        // VALIDATE USAGE LIMIT
        const usageLimit = Number(req.body.usageLimit);

        if (!Number.isInteger(usageLimit) || usageLimit < 1) {
            return res.status(400).json({
                message: "Please provide a valid usage limit."
            });
        }

        // VALIDATE OPTIONAL EXPIRY DATE
        let expiresAt = null;

        if (req.body.expiresAt) {
            expiresAt = new Date(req.body.expiresAt);

            if (
                Number.isNaN(expiresAt.getTime()) ||
                expiresAt <= new Date()
            ) {
                return res.status(400).json({
                    message: "Please provide a valid future expiry date."
                });
            }
        }

        // GENERATE SECURE INVITATION CODE
        const code = crypto.randomBytes(16)
            .toString("hex")
            .toUpperCase();

        // DEBUG: CHECK CREATOR ID
        console.log("CREATOR ID:", req.user._id);
        console.log("CREATOR NAME:", req.user.name);
        console.log("CREATOR ROLE:", req.user.role);

        // CREATE INVITATION
        const invitation = await Invitation.create({
            code,
            usageLimit,
            usedCount: 0,
            expiresAt,
            status: "ACTIVE",
            createdBy: req.user._id
        });

        console.log("SAVED INVITATION CREATOR:", invitation.createdBy);

        return res.status(201).json({
            message: "Invitation generated successfully.",
            invitation,
            remainingQuota:
                req.user.invitationQuota - totalInvitations - 1
        });

    } catch (error) {
        console.error("GENERATE INVITATION ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getMyApplication,
    generateInvitation
};