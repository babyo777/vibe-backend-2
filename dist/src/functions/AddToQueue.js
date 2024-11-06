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
exports.addToQueue = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const queueModel_1 = __importDefault(require("../models/queueModel"));
const roomModel_1 = __importDefault(require("../models/roomModel"));
const addToQueue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction(); // Start the transaction
    try {
        const data = req.body; // Expecting `data` to be an array of song objects
        const roomId = String(req.query.room);
        const userId = req.userId;
        if (!userId)
            throw new Error("Invalid userId");
        if (!roomId)
            throw new Error("Room ID is required.");
        const room = yield roomModel_1.default.findOne({ roomId }).session(session);
        if (!room)
            throw new Error("Invalid roomId");
        // Fetch existing songs in the queue for the room
        const existingSongs = yield queueModel_1.default.find({ roomId: room._id })
            .select("songData order")
            .lean()
            .session(session);
        const existingSongIds = new Set(existingSongs.map((song) => song.songData.id));
        // Filter out songs that are not already in the queue
        const songsToAdd = data.filter((song) => !existingSongIds.has(song.id));
        if (songsToAdd.length === 0) {
            // No new songs to add, commit transaction and return
            yield session.commitTransaction();
            return res.status(400).json({ message: "Song already exists in queue." });
        }
        // Get the maximum order directly from the database
        const maxOrderResult = yield queueModel_1.default.aggregate([
            { $match: { roomId: room._id } },
            { $group: { _id: null, maxOrder: { $max: "$order" } } },
        ]).session(session);
        const maxOrder = maxOrderResult.length > 0 ? maxOrderResult[0].maxOrder : 0;
        // Prepare new songs to be inserted with incremented order
        const newSongs = songsToAdd.map((song, index) => ({
            roomId: room._id,
            isPlaying: existingSongs.length === 0 && index === 0,
            songData: Object.assign(Object.assign({}, song), { addedBy: userId }),
            order: maxOrder + index + 1,
        }));
        // Insert new songs and update `queueId` in bulk
        const insertedSongs = yield queueModel_1.default.insertMany(newSongs, { session });
        const updates = insertedSongs.map((song) => ({
            updateOne: {
                filter: { _id: song._id },
                update: { "songData.queueId": song._id.toString() },
            },
        }));
        if (updates.length > 0) {
            yield queueModel_1.default.bulkWrite(updates, { session });
        }
        // Commit the transaction after successful insert and update
        yield session.commitTransaction();
        res.json({ message: "Songs added to the queue successfully." });
    }
    catch (error) {
        yield session.abortTransaction(); // Rollback transaction on error
        console.error("Error adding songs to queue:", error.message);
        res.status(500).json({ error: error.message });
    }
    finally {
        session.endSession(); // End the session
    }
});
exports.addToQueue = addToQueue;
