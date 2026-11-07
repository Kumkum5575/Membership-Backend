require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");
const Invitation = require("./models/Invitation");

const createAdmin = async () => {
    try {
        // Environment variables
        const adminEmail = process.env.SEED_ADMIN_EMAIL;
        const adminPassword = process.env.SEED_ADMIN_PASSWORD;
        const invitationCode = process.env.SEED_INVITATION_CODE;

        if (!adminEmail || !adminPassword || !invitationCode) {
            throw new Error("Seed environment variables are missing");
        }

        // Connect to database
        await connectDB();

        // Hash new admin password
        const hashedPassword = await bcrypt.hash(
            adminPassword,
            10
        );

        // Find existing admin
        let admin = await User.findOne({
            email: adminEmail
        });

        if (!admin) {
            admin = await User.create({
                name: "Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
                accountStatus: "ACTIVE"
            });

            console.log("Admin created successfully");
        } else {
            // Update existing admin password
            admin.password = hashedPassword;

            await admin.save();

            console.log("Existing admin password updated successfully");
        }

        // Check existing invitation
        const existingInvitation = await Invitation.findOne({
            code: invitationCode
        });

        if (!existingInvitation) {
            await Invitation.create({
                code: invitationCode,
                usageLimit: 10,
                expiresAt: new Date("2027-12-31"),
                status: "ACTIVE"
            });

            console.log("New invitation created successfully");
        } else {
            console.log("Invitation already exists");
        }

        await mongoose.disconnect();

        console.log("Seed completed successfully");

    } catch (error) {
        console.error("Seed Error:", error.message);

        await mongoose.disconnect().catch(() => {});

        process.exit(1);
    }
};

createAdmin();