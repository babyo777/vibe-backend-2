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
exports.handleDisconnect = handleDisconnect;
const customEmit_1 = require("../lib/customEmit");
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
function handleDisconnect(socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userInfo, roomInfo } = socket;
            if (!roomInfo || !userInfo)
                return;
            const data = yield roomUsers_1.default.findOneAndUpdate({ userId: userInfo === null || userInfo === void 0 ? void 0 : userInfo.id, roomId: roomInfo === null || roomInfo === void 0 ? void 0 : roomInfo._id }, {
                active: false,
            })
                .populate("userId")
                .select("username");
            if (roomInfo.roomId) {
                (0, customEmit_1.emitMessage)(socket, roomInfo.roomId, "userLeftRoom", (data === null || data === void 0 ? void 0 : data.userId) || { username: "Someone" });
            }
            socket.leave(roomInfo.roomId);
        }
        catch (error) {
            console.log(error);
        }
    });
}
