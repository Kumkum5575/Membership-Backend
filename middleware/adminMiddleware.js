const adminMiddleware = (req, res, next) => {

    if (
        !req.user ||
        req.user.role !== "admin" ||
        req.user.accountStatus !== "ACTIVE"
    ) {
        return res.status(403).json({
            message: "Only active Admin can access this route"
        });
    }

    next();
};

module.exports = adminMiddleware;