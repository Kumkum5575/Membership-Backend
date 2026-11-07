const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");


// REGISTER API
router.post("/register", registerUser);


// LOGIN API
router.post("/login", loginUser);


// GET USER PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        res.status(200).json({
            user: {
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                accountStatus: req.user.accountStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;