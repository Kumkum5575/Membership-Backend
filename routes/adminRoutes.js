const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
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
} = require("../controllers/adminController");

// All routes below require an active Admin
router.use(authMiddleware, adminMiddleware);

// CREATE INVITATION
router.post("/create-invitation", createInvitation);

// GET ALL INVITATIONS
router.get("/invitations", getInvitations);

// GET INVITATION REDEMPTIONS
router.get("/invitations/:id/redemptions", getRedemptions);

// REVOKE INVITATION
router.put("/revoke-invitation/:id", revokeInvitation);

// GET ALL APPLICATIONS
router.get("/applications", getApplications);

// REVIEW APPLICATION
router.put("/review/:id", reviewApplication);

// UPDATE PRIORITY
router.put("/priority/:id", updatePriority);

// APPROVE APPLICATION
router.put("/approve/:id", approveApplication);

// REJECT APPLICATION
router.put("/reject/:id", rejectApplication);

// UPDATE ADMIN NOTES
router.put("/notes/:id", updateAdminNotes);

// UPDATE MEMBER INVITATION SETTINGS
router.put(
    "/member-invitation-settings/:id",
    updateMemberInvitationSettings
);

// SUSPEND MEMBER
router.put("/members/:id/suspend", suspendMember);

// REACTIVATE MEMBER
router.put("/members/:id/reactivate", reactivateMember);

module.exports = router;