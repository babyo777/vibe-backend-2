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
exports.handlePlay = handlePlay;
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const error_1 = require("./error");
const voteModel_1 = __importDefault(require("../models/voteModel"));
function handlePlay(io, socket, song) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !song)
                return;
            if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.role) !== "admin")
                return;
            const value = (0, lock_1.decrypt)(song);
            yield queueModel_1.default.updateOne({ roomId: roomInfo._id, isPlaying: true }, {
                isPlaying: false,
            }),
                yield queueModel_1.default.updateOne({
                    roomId: roomInfo._id,
                    "songData.id": value.id,
                }, { isPlaying: true }),
                yield voteModel_1.default.deleteMany({
                    roomId: roomInfo._id,
                    queueId: value.currentQueueId,
                });
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "play", value);
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            console.log("PLAY ERROR: " + error);
            (0, error_1.errorHandler)(socket, error.message);
        }
    });
}
