const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },

    usageLimit: {
        type: Number,
        required: true,
        default: 1,
        min: 1
    },

    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },

    expiresAt: {
        type: Date,
        default: null
    },

    status: {
        type: String,
        enum: ["ACTIVE", "REVOKED"],
        default: "ACTIVE"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model("Invitation", invitationSchema);