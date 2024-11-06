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
exports.bulkDelete = bulkDelete;
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const voteModel_1 = __importDefault(require("../models/voteModel"));
const error_1 = require("./error");
function bulkDelete(io, socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !data || data.length === 0)
                return;
            if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) !== "admin")
                throw new Error("only admins can delete");
            const value = (0, lock_1.decrypt)(data);
            const songIds = value.map((song) => song.id);
            const queueIds = value.map((song) => song.queueId);
            yield Promise.all([
                yield queueModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                    "songData.id": { $in: songIds },
                }),
                yield voteModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                    queueId: { $in: queueIds },
                }),
            ]);
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            console.log("BULK DELETE ERROR", error);
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}
