const User = require("../models/User");
const Invitation = require("../models/Invitation");
const Application = require("../models/Application");
const InvitationRedemption = require("../models/InvitationRedemption");
const Notification = require("../models/Notification");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            invitationCode,
            phone,
            designation,
            company,
            experience
        } = req.body;

        // VALIDATE REQUIRED FIELDS
        if (
            !name ||
            !email ||
            !password ||
            !invitationCode ||
            !phone ||
            !designation ||
            !company ||
            !experience
        ) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // CHECK EXISTING USER
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // PASSWORD VALIDATION
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        // VALIDATE INVITATION
        const invitation = await Invitation.findOneAndUpdate(
            {
                code: invitationCode.trim().toUpperCase(),
                status: "ACTIVE",

                $or: [
                    { expiresAt: null },
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } }
                ],

                $expr: {
                    $lt: ["$usedCount", "$usageLimit"]
                }
            },
            {
                $inc: {
                    usedCount: 1
                }
            },
            {
                new: true
            }
        );

        if (!invitation) {
            return res.status(400).json({
                message: "Invalid, expired or fully used invitation code"
            });
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,

            phone: phone.trim(),
            designation: designation.trim(),
            company: company.trim(),
            experience: experience.trim()
        });

        // CREATE MEMBERSHIP APPLICATION
        await Application.create({
            user: user._id,
            invitation: invitation._id
        });

        // SAVE INVITATION REDEMPTION
        await InvitationRedemption.create({
            user: user._id,
            invitation: invitation._id
        });

        // NOTIFICATION FOR APPLICANT
        await Notification.create({
            user: user._id,
            message: "Your application has been submitted successfully."
        });

        // NOTIFICATION FOR ALL ADMINS
        const admins = await User.find({
            role: "admin"
        }).select("_id");

        if (admins.length > 0) {
            const adminNotifications = admins.map((admin) => ({
                user: admin._id,
                message: `New membership application received from ${name} (${normalizedEmail}).`
            }));

            await Notification.insertMany(adminNotifications);
        }

        return res.status(201).json({
            message: "Registration successful. Waiting for admin approval."
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        if (
            user.accountStatus === "REJECTED" ||
            user.accountStatus === "SUSPENDED"
        ) {
            return res.status(403).json({
                message: "Your account is not allowed to login"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};