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
exports.sendMessage = sendMessage;
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
const utils_1 = require("../lib/utils");
const userModel_1 = __importDefault(require("../models/userModel"));
const error_1 = require("./error");
function sendMessage(io, socket, message) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !userInfo || !message)
                throw new Error("Login required");
            const user = yield userModel_1.default.findById(userInfo.id).select("imageUrl username name");
            if ((0, lock_1.decrypt)(message).length > 500)
                throw new Error("Maximum Message Size exceeded");
            const payload = {
                user,
                message: (0, lock_1.decrypt)(message),
                time: (0, utils_1.getTime)(),
            };
            (0, customEmit_1.broadcast)(io, roomInfo === null || roomInfo === void 0 ? void 0 : roomInfo.roomId, "message", payload);
        }
        catch (error) {
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}
