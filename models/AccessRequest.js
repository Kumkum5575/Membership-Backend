const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    status: {
        type: String,
        enum: ["PENDING", "REVIEWED", "CLOSED"],
        default: "PENDING"
    }

}, { timestamps: true });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);