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
exports.queue = void 0;
const utils_1 = require("../lib/utils");
const queueModel_1 = __importDefault(require("../models/queueModel"));
const roomModel_1 = __importDefault(require("../models/roomModel"));
const queue = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const name = String(req.query.name) || "";
        const roomId = String(req.query.room) || "";
        if (!roomId)
            throw new Error("Invalid roomId");
        const room = yield roomModel_1.default.findOne({ roomId }).select("_id");
        if (!room)
            throw new Error("Room not found");
        const [total, results] = yield Promise.all([
            queueModel_1.default.countDocuments({ roomId: room._id }),
            queueModel_1.default.aggregate((0, utils_1.getQueuePipeline)(room._id, userId, page, limit, name)),
        ]);
        const payload = {
            total,
            start: page,
            results,
        };
        return res.json(payload);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.queue = queue;
