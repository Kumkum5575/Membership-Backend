const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const memberMiddleware = require("../middleware/memberMiddleware");

const {
    getDashboard,
    getMyApplication,
    generateInvitation
} = require("../controllers/memberController");

// MEMBER DASHBOARD
router.get(
    "/dashboard",
    authMiddleware,
    memberMiddleware,
    getDashboard
);

// CHECK MY APPLICATION
router.get(
    "/my-application",
    authMiddleware,
    getMyApplication
);

// GENERATE INVITATION
router.post(
    "/generate-invitation",
    authMiddleware,
    memberMiddleware,
    generateInvitation
);

module.exports = router;