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
exports.default = addQueue;
const queueModel_1 = __importDefault(require("../models/queueModel"));
const error_1 = require("./error");
const customEmit_1 = require("../lib/customEmit");
function addQueue(io, socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield queueModel_1.default.startSession(); // Start a session for transaction
        session.startTransaction(); // Start transaction
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !userInfo)
                throw new Error("Login required.");
            const existingSongs = yield queueModel_1.default.find({ roomId: roomInfo._id })
                .select("songData")
                .lean()
                .session(session); // Use session for transaction
            const existingSongIds = new Set(existingSongs.map((song) => song.songData.id));
            const songsToAdd = data.filter((song) => !existingSongIds.has(song.id));
            if (songsToAdd.length > 0) {
                const newSongs = songsToAdd.map((song, index) => ({
                    roomId: roomInfo._id,
                    isPlaying: existingSongs.length === 0 && index === 0,
                    songData: Object.assign(Object.assign({}, song), { addedBy: userInfo.id }),
                    order: existingSongs.length + index + 1, // Maintain order based on existing songs
                }));
                const insertedSongs = yield queueModel_1.default.insertMany(newSongs, { session }); // Insert with session
                // Prepare bulk updates
                const updates = insertedSongs.map((song) => ({
                    updateOne: {
                        filter: { _id: song._id },
                        update: { "songData.queueId": song._id.toString() },
                    },
                }));
                if (updates.length > 0) {
                    yield queueModel_1.default.bulkWrite(updates, { session }); // Bulk write with session
                }
            }
            yield session.commitTransaction(); // Commit transaction
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            yield session.abortTransaction(); // Abort transaction on error
            console.error("Error adding songs to queue:", error.message);
            (0, error_1.errorHandler)(socket, error.message);
        }
        finally {
            session.endSession(); // End the session
        }
    });
}
