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
exports.upNextSong = void 0;
const utils_1 = require("../lib/utils");
const roomModel_1 = __importDefault(require("../models/roomModel"));
const upNextSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = String(req.query.room) || "";
        if (!roomId)
            throw new Error("Invalid roomId");
        const room = yield roomModel_1.default.findOne({ roomId });
        if (!room)
            return res.status(400).json({ message: "Invalid roomId" });
        let nextSong = [];
        const value = (yield (0, utils_1.getCurrentlyPlaying)(room._id))[0];
        nextSong = yield (0, utils_1.getCurrentlyPlaying)(room === null || room === void 0 ? void 0 : room._id, undefined, false);
        if ((nextSong === null || nextSong === void 0 ? void 0 : nextSong.length) == 0) {
            nextSong = yield (0, utils_1.getSongByOrder)(room === null || room === void 0 ? void 0 : room._id, value === null || value === void 0 ? void 0 : value.order);
        }
        res.json(nextSong);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.upNextSong = upNextSong;
