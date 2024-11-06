"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    var _a;
    const session = req.cookies.vibeIdR || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]); // Access the session cookie
    // Check if the session cookie is present
    if (!session) {
        return res.status(401).json({ message: "No session found" }); // Use 401 for unauthorized
    }
    try {
        // Verify the JWT token
        const decoded = jsonwebtoken_1.default.verify(session, process.env.JWT_SECRET || "");
        // Check if the decoded token contains a valid userId
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: "Invalid token" }); // Use 401 for invalid token
        }
        // Attach userId to the request object for further use
        req.userId = decoded.userId;
        // Call the next middleware or route handler
        next();
    }
    catch (error) {
        // Handle token verification errors
        return res
            .status(403)
            .json({ message: "Token verification failed", error: error.message });
    }
};
exports.authMiddleware = authMiddleware;
