import { User } from "../models/user.model.js";
import httpStatus from "http-status";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Authorization token required" });
        }

        const token = authHeader.split(" ")[1];
        const user = await User.findOne({ token });

        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired token" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Authentication failed" });
    }
};

export default authMiddleware;
