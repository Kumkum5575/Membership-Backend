const memberMiddleware = (req, res, next) => {

    if (
        !req.user ||
        req.user.role !== "member" ||
        req.user.accountStatus !== "ACTIVE"
    ) {
        return res.status(403).json({
            message: "Your account is not active"
        });
    }

    next();
};

module.exports = memberMiddleware;