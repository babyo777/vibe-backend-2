"use strict";
// using in new
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
exports.middleware = middleware;
const error_1 = require("./error");
const roomModel_1 = __importDefault(require("../models/roomModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
const utils_1 = require("../lib/utils");
function middleware(socket, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            let user = null;
            const token = socket.handshake.headers["authorization"];
            const roomId = socket.handshake.headers["room"];
            if (!roomId || typeof roomId !== "string")
                throw new Error("Invalid roomId");
            if (token && token.length > 0) {
                const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "");
                user = yield userModel_1.default.findById(decode.userId).select("username");
            }
            const room = yield roomModel_1.default.findOne({ roomId });
            if (!room && !user)
                throw new Error("Only Logged in user can make new Room");
            const newRoom = yield roomModel_1.default.findOneAndUpdate({ roomId }, {}, { new: true, upsert: true });
            socket.join(roomId);
            socket.roomInfo = {
                roomId: newRoom.roomId,
                _id: newRoom._id.toString(),
                progress: newRoom.progress,
            };
            if (user) {
                const existingUser = yield roomUsers_1.default.findOne({
                    userId: user._id.toString(),
                    roomId: newRoom._id,
                }).select("role");
                let userRole;
                if (existingUser) {
                    userRole = existingUser.role;
                }
                else {
                    const users = yield roomUsers_1.default.countDocuments({ roomId: newRoom._id });
                    userRole = users > 0 ? "listener" : "admin";
                }
                const addedUser = yield roomUsers_1.default.findOneAndUpdate({ userId: user._id.toString(), roomId: newRoom._id }, {
                    active: true,
                    socketid: socket.id,
                    role: userRole,
                }, { upsert: true, new: true });
                socket.userInfo = {
                    id: addedUser.userId.toString(),
                    role: addedUser.role,
                };
            }
            socket.emit("joined", (0, lock_1.encrypt)(Object.assign(Object.assign({}, socket.roomInfo), { role: (_a = socket.userInfo) === null || _a === void 0 ? void 0 : _a.role })));
            const currentSong = (yield (0, utils_1.getCurrentlyPlaying)(socket.roomInfo._id, (_b = socket.userInfo) === null || _b === void 0 ? void 0 : _b.id))[0];
            if (currentSong) {
                socket.emit("isplaying", (0, lock_1.encrypt)(currentSong));
            }
            (0, customEmit_1.emitMessage)(socket, roomId, "userJoinedRoom", user || { username: "someone" });
            next();
        }
        catch (error) {
            console.log("MIDDLEWARE ERROR:", error);
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}
