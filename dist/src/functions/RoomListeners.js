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
exports.roomListeners = void 0;
const roomModel_1 = __importDefault(require("../models/roomModel"));
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const roomListeners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = String(req.query.room) || "";
        if (!roomId)
            throw new Error("Invalid roomId");
        const room = yield roomModel_1.default.findOne({ roomId });
        if (!room)
            return res.status(400).json({ message: "Invalid roomId" });
        // Fetch active room users and populate user information
        const roomUsers = yield roomUsers_1.default.find({ roomId: room._id, active: true })
            .populate({
            path: "userId",
            select: "name username imageUrl", // Select only necessary fields
        })
            .limit(17)
            .select("userId -_id");
        // Count the total number of active listeners
        const totalListeners = yield roomUsers_1.default.countDocuments({
            roomId: room._id,
            active: true,
        });
        const payload = {
            totalUsers: totalListeners,
            currentPage: 1,
            roomUsers,
        };
        res.json(payload);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.roomListeners = roomListeners;
