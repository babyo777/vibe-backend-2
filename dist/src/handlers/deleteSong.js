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
exports.default = deleteSong;
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const voteModel_1 = __importDefault(require("../models/voteModel"));
const error_1 = require("./error");
function deleteSong(io, socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !userInfo)
                throw new Error("Login Required");
            if (!data)
                return;
            const value = (0, lock_1.decrypt)(data);
            if (userInfo.role === "admin" || (value === null || value === void 0 ? void 0 : value.addedBy) === userInfo.id) {
                yield queueModel_1.default.deleteOne({
                    roomId: roomInfo === null || roomInfo === void 0 ? void 0 : roomInfo._id,
                    "songData.queueId": value.queueId,
                });
                yield voteModel_1.default.deleteMany({ queueId: value.queueId });
                (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
            }
            else {
                throw new Error("Only admin and user who added this song can delete it");
            }
        }
        catch (error) {
            console.log("DELETE ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
