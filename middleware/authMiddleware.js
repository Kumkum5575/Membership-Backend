const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please login first"
            });
        }

        const actualToken = token.split(" ")[1];

        const decoded = jwt.verify(
            actualToken,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // BLOCK SUSPENDED USERS
        if (user.accountStatus === "SUSPENDED") {
            return res.status(403).json({
                message: "Your account has been suspended"
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;