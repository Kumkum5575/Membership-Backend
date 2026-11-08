const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const Invitation = require("../models/Invitation");
const Application = require("../models/Application");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");
const InvitationRedemption = require("../models/InvitationRedemption");

// CHECK VALID MONGODB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ADD APPLICATION REVIEW HISTORY
const addReviewHistory = (application, req, data) => {
    application.reviewHistory.push({
        action: data.action,
        performedBy: req.user._id,
        note: data.note || "",
        previousValue: data.previousValue || "",
        newValue: data.newValue || ""
    });

    application.reviewedBy = req.user._id;
};

// CREATE INVITATION
const createInvitation = async (req, res) => {
    try {
        const { usageLimit, expiryDays } = req.body;

        if (
            !Number.isInteger(usageLimit) ||
            usageLimit < 1 ||
            (expiryDays !== undefined &&
                (!Number.isInteger(expiryDays) || expiryDays < 1))
        ) {
            return res.status(400).json({
                message: "Enter valid usage limit and expiry days"
            });
        }

        const code = crypto.randomBytes(16).toString("hex").toUpperCase();

        let expiresAt = null;

        if (expiryDays !== undefined) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);
        }

        const invitation = await Invitation.create({
            code,
            usageLimit,
            expiresAt,
            createdBy: req.user._id
        });

        await AuditLog.create({
            admin: req.user._id,
            action: "INVITATION_CREATED",
            details: `Created invitation ${code} with usage limit ${usageLimit}`
        });

        return res.status(201).json({
            message: "Invitation created successfully",
            invitation
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// GET ALL INVITATIONS
const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find()
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json(invitations);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// REVOKE INVITATION
const revokeInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid invitation ID"
            });
        }

        const invitation = await Invitation.findById(id);

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found"
            });
        }

        if (invitation.status === "REVOKED") {
            return res.status(400).json({
                message: "Invitation is already revoked"
            });
        }

        invitation.status = "REVOKED";
        await invitation.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "INVITATION_REVOKED",
            details: `Revoked invitation ${invitation.code}`
        });

        return res.status(200).json({
            message: "Invitation revoked successfully",
            invitation
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// GET ALL APPLICATIONS WITH PERFORMANCE TIMING
const getApplications = async (req, res) => {
    const requestStartedAt = Date.now();

    let userSearchMs = 0;
    let applicationQueryMs = 0;

    try {
        const {
            search,
            status,
            priority,
            sort
        } = req.query;

        const filter = {};

        // STATUS FILTER
        if (status && status !== "ALL") {
            const allowedStatuses = [
                "PENDING",
                "UNDER_REVIEW",
                "APPROVED",
                "REJECTED"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid application status"
                });
            }

            filter.applicationStatus = status;
        }

        // PRIORITY FILTER
        if (priority && priority !== "ALL") {
            const allowedPriorities = [
                "Critical",
                "High",
                "Medium",
                "Low"
            ];

            if (!allowedPriorities.includes(priority)) {
                return res.status(400).json({
                    message: "Invalid priority"
                });
            }

            filter.priority = priority;
        }

        // SEARCH BY USER NAME OR EMAIL
        if (search && search.trim()) {

            const searchText = search.trim();

            const escapedSearch = searchText.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            const searchRegex = new RegExp(escapedSearch, "i");

            const userSearchStartedAt = Date.now();

            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            })
                .select("_id")
                .lean();

            userSearchMs = Date.now() - userSearchStartedAt;

            const matchingUserIds = matchingUsers.map(
                user => user._id
            );

            if (matchingUserIds.length === 0) {
                console.log("APPLICATION PERFORMANCE:", {
                    userSearchMs,
                    applicationQueryMs,
                    totalMs: Date.now() - requestStartedAt,
                    resultCount: 0
                });

                return res.status(200).json([]);
            }

            filter.user = {
                $in: matchingUserIds
            };
        }

        // SORTING
        let sortOption = { createdAt: -1 };

        if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        }

        // FETCH APPLICATIONS
        const applicationQueryStartedAt = Date.now();

        let applications = await Application.find(filter)
            .populate(
                "user",
                "name email phone designation company experience accountStatus canGenerateInvitations invitationQuota"
            )
            .populate({
                path: "invitation",
                select: "code createdBy",
                populate: {
                    path: "createdBy",
                    select: "name email"
                }
            })
            .populate("reviewedBy", "name email")
            .populate("reviewHistory.performedBy", "name email role")
            .sort(sortOption)
            .lean();

        applicationQueryMs = Date.now() - applicationQueryStartedAt;

        // PRIORITY SORTING
        if (sort === "priority") {

            const priorityOrder = {
                Critical: 1,
                High: 2,
                Medium: 3,
                Low: 4
            };

            applications.sort((a, b) => {
                return (
                    priorityOrder[a.priority] -
                    priorityOrder[b.priority]
                );
            });
        }

        // PERFORMANCE LOGS
        console.log("APPLICATION PERFORMANCE:", {
            userSearchMs,
            applicationQueryMs,
            totalMs: Date.now() - requestStartedAt,
            resultCount: applications.length
        });

        return res.status(200).json(applications);

    } catch (error) {
        console.error("Get Applications Error:", error);

        console.log("APPLICATION PERFORMANCE ERROR:", {
            userSearchMs,
            applicationQueryMs,
            totalMs: Date.now() - requestStartedAt
        });

        return res.status(500).json({
            message: error.message
        });
    }
};

// APPROVE APPLICATION
const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (
            !["PENDING", "UNDER_REVIEW"].includes(
                application.applicationStatus
            )
        ) {
            return res.status(400).json({
                message: "Application has already been processed"
            });
        }

        const user = await User.findById(application.user);

        if (!user) {
            return res.status(404).json({
                message: "Applicant not found"
            });
        }

        const previousStatus = application.applicationStatus;

        user.accountStatus = "ACTIVE";
        await user.save();

        application.applicationStatus = "APPROVED";

        if (note !== undefined) {
            application.adminNotes = note;
        }

        addReviewHistory(application, req, {
            action: "APPLICATION_APPROVED",
            note: note || "",
            previousValue: previousStatus,
            newValue: "APPROVED"
        });

        await application.save();

        await Notification.create({
            user: user._id,
            message: "Congratulations! Your membership has been approved."
        });

        await AuditLog.create({
            admin: req.user._id,
            action: "APPLICATION_APPROVED",
            details: `Approved application of ${user.email}`
        });

        return res.status(200).json({
            message: "Application approved successfully",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// REJECT APPLICATION
const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (
            !["PENDING", "UNDER_REVIEW"].includes(
                application.applicationStatus
            )
        ) {
            return res.status(400).json({
                message: "Application has already been processed"
            });
        }

        const user = await User.findById(application.user);

        if (!user) {
            return res.status(404).json({
                message: "Applicant not found"
            });
        }

        const previousStatus = application.applicationStatus;

        user.accountStatus = "REJECTED";
        await user.save();

        application.applicationStatus = "REJECTED";

        if (note !== undefined) {
            application.adminNotes = note;
        }

        addReviewHistory(application, req, {
            action: "APPLICATION_REJECTED",
            note: note || "",
            previousValue: previousStatus,
            newValue: "REJECTED"
        });

        await application.save();

        await Notification.create({
            user: user._id,
            message: "Your membership application has been rejected."
        });

        await AuditLog.create({
            admin: req.user._id,
            action: "APPLICATION_REJECTED",
            details: `Rejected application of ${user.email}`
        });

        return res.status(200).json({
            message: "Application rejected successfully",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// UPDATE APPLICATION PRIORITY
const updatePriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        const allowedPriorities = [
            "Critical",
            "High",
            "Medium",
            "Low"
        ];

        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority"
            });
        }

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        const previousPriority = application.priority;

        application.priority = priority;

        addReviewHistory(application, req, {
            action: "PRIORITY_UPDATED",
            previousValue: previousPriority,
            newValue: priority
        });

        await application.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "PRIORITY_UPDATED",
            details: `Application ${application._id}: priority changed from ${previousPriority} to ${priority}`
        });

        return res.status(200).json({
            message: "Priority updated successfully",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// MARK APPLICATION UNDER REVIEW + SAVE ADMIN NOTES
const reviewApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, adminNotes } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        if (
            !["PENDING", "UNDER_REVIEW"].includes(
                application.applicationStatus
            )
        ) {
            return res.status(400).json({
                message: "Application has already been processed"
            });
        }

        const previousStatus = application.applicationStatus;
        const reviewNote = adminNotes ?? note ?? "";

        application.applicationStatus = "UNDER_REVIEW";

        if (adminNotes !== undefined) {
            application.adminNotes = adminNotes;
        }

        addReviewHistory(application, req, {
            action: "APPLICATION_UNDER_REVIEW",
            note: reviewNote,
            previousValue: previousStatus,
            newValue: "UNDER_REVIEW"
        });

        await application.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "APPLICATION_UNDER_REVIEW",
            details: `Application ${application._id} moved under review`
        });

        return res.status(200).json({
            message: "Application moved under review",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// UPDATE MEMBER INVITATION PERMISSION AND QUOTA
const updateMemberInvitationSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { canGenerateInvitations, invitationQuota } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (
            typeof canGenerateInvitations !== "boolean" ||
            !Number.isInteger(invitationQuota) ||
            invitationQuota < 0
        ) {
            return res.status(400).json({
                message: "Enter valid invitation permission and quota"
            });
        }

        const user = await User.findOne({
            _id: id,
            role: "member"
        });

        if (!user) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        const totalInvitations = await Invitation.countDocuments({
            createdBy: user._id
        });

        if (invitationQuota < totalInvitations) {
            return res.status(400).json({
                message: "Quota cannot be less than invitations already generated",
                totalInvitations
            });
        }

        user.canGenerateInvitations = canGenerateInvitations;
        user.invitationQuota = invitationQuota;

        await user.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "MEMBER_INVITATION_SETTINGS_UPDATED",
            details: `Updated invitation permission and quota for ${user.email}`
        });

        return res.status(200).json({
            message: "Member invitation settings updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                canGenerateInvitations: user.canGenerateInvitations,
                invitationQuota: user.invitationQuota
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// GET INVITATION REDEMPTIONS
const getRedemptions = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid invitation ID"
            });
        }

        const invitation = await Invitation.findById(id);

        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found"
            });
        }

        const redemptions = await InvitationRedemption.find({
            invitation: id
        })
            .populate("user", "name email")
            .sort({ redeemedAt: -1 });

        return res.status(200).json(redemptions);

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// UPDATE ADMIN NOTES
const updateAdminNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid application ID"
            });
        }

        if (typeof adminNotes !== "string") {
            return res.status(400).json({
                message: "Admin notes must be text"
            });
        }

        const application = await Application.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        const previousNotes = application.adminNotes || "";

        application.adminNotes = adminNotes;

        addReviewHistory(application, req, {
            action: "ADMIN_NOTES_UPDATED",
            note: adminNotes,
            previousValue: previousNotes,
            newValue: adminNotes
        });

        await application.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "ADMIN_NOTES_UPDATED",
            details: `Updated admin notes for application ${id}`
        });

        return res.status(200).json({
            message: "Admin notes saved successfully",
            application
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// SUSPEND MEMBER
const suspendMember = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await User.findOne({
            _id: id,
            role: "member"
        });

        if (!user) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        if (user.accountStatus !== "ACTIVE") {
            return res.status(400).json({
                message: "Only active members can be suspended"
            });
        }

        user.accountStatus = "SUSPENDED";
        await user.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "MEMBER_SUSPENDED",
            details: `Suspended member ${user.email}`
        });

        await Notification.create({
            user: user._id,
            message: "Your membership has been suspended. Please contact the administrator."
        });

        return res.status(200).json({
            message: "Member suspended successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// REACTIVATE MEMBER
const reactivateMember = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        const user = await User.findOne({
            _id: id,
            role: "member"
        });

        if (!user) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        if (user.accountStatus !== "SUSPENDED") {
            return res.status(400).json({
                message: "Member is not suspended"
            });
        }

        user.accountStatus = "ACTIVE";
        await user.save();

        await AuditLog.create({
            admin: req.user._id,
            action: "MEMBER_REACTIVATED",
            details: `Reactivated member ${user.email}`
        });

        await Notification.create({
            user: user._id,
            message: "Your membership has been reactivated."
        });

        return res.status(200).json({
            message: "Member reactivated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

// EXPORT ALL CONTROLLERS
module.exports = {
    createInvitation,
    getInvitations,
    revokeInvitation,
    getApplications,
    approveApplication,
    rejectApplication,
    updatePriority,
    reviewApplication,
    getRedemptions,
    updateMemberInvitationSettings,
    updateAdminNotes,
    suspendMember,
    reactivateMember
};