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
exports.deleteAll = deleteAll;
const customEmit_1 = require("../lib/customEmit");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const voteModel_1 = __importDefault(require("../models/voteModel"));
const error_1 = require("./error");
function deleteAll(io, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo)
                return;
            if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) !== "admin")
                throw new Error("only admins can delete all songs");
            yield Promise.all([
                yield queueModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                    isPlaying: false,
                }),
                yield voteModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                }),
            ]);
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            console.log("DELETE ALL ERROR:", error);
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}