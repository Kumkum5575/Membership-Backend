const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/member", require("./routes/memberRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/audit-logs", require("./routes/auditLogRoutes"));
app.use("/api/access-requests", require("./routes/accessRequestRoutes"));

// Home Route
app.get("/", (req, res) => {
    res.send("Invitation Membership Backend is Running");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});