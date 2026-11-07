
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        designation: {
            type: String,
            trim: true,
            default: ""
        },

        company: {
            type: String,
            trim: true,
            default: ""
        },

        experience: {
            type: String,
            trim: true,
            default: ""
        },

        role: {
            type: String,
            enum: ["member", "admin"],
            default: "member"
        },

        accountStatus: {
            type: String,
            enum: [
                "PENDING_APPROVAL",
                "ACTIVE",
                "REJECTED",
                "SUSPENDED"
            ],
            default: "PENDING_APPROVAL"
        },

        canGenerateInvitations: {
            type: Boolean,
            default: false
        },

        invitationQuota: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
