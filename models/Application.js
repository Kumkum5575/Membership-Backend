const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    invitation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invitation",
        required: true
    },

    priority: {
        type: String,
        enum: ["Critical", "High", "Medium", "Low"],
        default: "Low"
    },

    applicationStatus: {
        type: String,
        enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"],
        default: "PENDING"
    },

    message: {
        type: String,
        default: ""
    },

    // Admin ke notes
    adminNotes: {
        type: String,
        default: ""
    },

    // Application review history
    reviewHistory: [
        {
            action: {
                type: String,
                required: true
            },

            performedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            note: {
                type: String,
                default: ""
            },

            previousValue: {
                type: String,
                default: ""
            },

            newValue: {
                type: String,
                default: ""
            },

            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    // Last reviewer
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);