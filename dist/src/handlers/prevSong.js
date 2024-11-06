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
exports.PlayPrevSong = PlayPrevSong;
const utils_1 = require("../lib/utils");
const error_1 = require("./error");
const customEmit_1 = require("../lib/customEmit");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const voteModel_1 = __importDefault(require("../models/voteModel"));
function PlayPrevSong(io, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !userInfo)
                throw new Error("Login required");
            if (userInfo.role !== "admin")
                throw new Error("Only admin is allowed to play prev");
            let nextSong = [];
            const value = (yield (0, utils_1.getCurrentlyPlaying)(roomInfo._id, userInfo.id))[0];
            yield queueModel_1.default.updateOne({ roomId: roomInfo._id, isPlaying: true }, {
                isPlaying: false,
            }),
                (nextSong = yield (0, utils_1.getPreviousSongByOrder)(roomInfo === null || roomInfo === void 0 ? void 0 : roomInfo._id, value.order));
            if (nextSong.length == 0) {
                yield queueModel_1.default.updateOne({
                    roomId: roomInfo._id,
                    "songData.id": value.id,
                }, { isPlaying: true });
                throw new Error("No more songs in the queue");
            }
            yield queueModel_1.default.updateOne({
                roomId: roomInfo._id,
                "songData.id": nextSong[0].id,
            }, { isPlaying: true }),
                yield voteModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                    queueId: nextSong[0].queueId,
                });
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "play", nextSong[0]);
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            console.log("NEXT SONG ERROR:", error);
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}
