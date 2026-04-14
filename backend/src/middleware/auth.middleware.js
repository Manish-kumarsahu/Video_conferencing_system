import httpStatus from "http-status";
import { verifyToken } from "../utils/jwt.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Authorization token required" });
        }

        const token = authHeader.split(" ")[1];
        const payload = verifyToken(token);

        req.user = { _id: payload.id };
        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res
                .status(httpStatus.UNAUTHORIZED)
                .json({ message: "Session expired. Please sign in again." });
        }
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({ message: "Invalid or expired token" });
    }
};

export default authMiddleware;
