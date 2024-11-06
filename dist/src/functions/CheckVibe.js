"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVibe = checkVibe;
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const userModel_1 = __importDefault(require("../models/userModel"));
const roomModel_1 = __importDefault(require("../models/roomModel"));
function checkVibe(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const userId = req.userId;
            const sessionCookie = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.vibeIdR; // Get cookies from the request
            const roomId = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.room; // Get room ID from cookies
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            const [user, room] = yield Promise.all([
                userModel_1.default.findById(userId), // Fetch the user by ID
                roomModel_1.default.findOne({ roomId }), // Fetch the room by roomId
            ]);
            const roleData = yield roomUsers_1.default.findOne({
                userId: userId,
                roomId: room === null || room === void 0 ? void 0 : room._id,
            }).select("role");
            if (!user)
                return res.status(401).json({ message: "Unauthorized" });
            const userData = Object.assign(Object.assign({}, user.toObject()), { token: sessionCookie, roomId, role: (roleData === null || roleData === void 0 ? void 0 : roleData.role) || "guest" });
            res.json(userData); // Send JSON response with user data
        }
        catch (error) {
            console.error("Error in getLoggedInUser:", error.message);
            res
                .status(500)
                .json({ message: "An error occurred while retrieving user data." });
        }
    });
}
