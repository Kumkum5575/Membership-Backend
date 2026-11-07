const mongoose = require("mongoose");

const redemptionSchema = new mongoose.Schema({

    invitation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invitation",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    redeemedAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

module.exports = mongoose.model("InvitationRedemption", redemptionSchema);