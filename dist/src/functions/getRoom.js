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
exports.getRooms = getRooms;
const mongoose_1 = __importDefault(require("mongoose"));
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
function getRooms(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            const roomAdmins = yield roomUsers_1.default.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.default.Types.ObjectId(userId),
                    },
                },
                {
                    $lookup: {
                        from: "rooms",
                        localField: "roomId",
                        foreignField: "_id",
                        as: "roomDetails",
                    },
                },
                {
                    $unwind: "$roomDetails",
                },
                {
                    $lookup: {
                        from: "roomusers",
                        let: { roomId: "$roomId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$roomId", "$$roomId"] },
                                            { $eq: ["$role", "admin"] },
                                        ],
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "userId",
                                    foreignField: "_id",
                                    as: "adminDetails",
                                },
                            },
                            {
                                $unwind: "$adminDetails",
                            },
                            {
                                $project: {
                                    _id: 0,
                                    adminName: "$adminDetails.name",
                                },
                            },
                        ],
                        as: "admins",
                    },
                },
                {
                    $lookup: {
                        from: "roomusers",
                        let: { roomId: "$roomId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$roomId", "$$roomId"],
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "userId",
                                    foreignField: "_id",
                                    as: "userDetails",
                                },
                            },
                            {
                                $unwind: "$userDetails",
                            },
                            {
                                $sample: { size: 4 },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    image: "$userDetails.imageUrl",
                                },
                            },
                        ],
                        as: "users",
                    },
                },
                {
                    $lookup: {
                        from: "queues",
                        let: { roomId: "$roomId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$roomId", "$$roomId"],
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    isPlaying: 1,
                                    songData: 1,
                                },
                            },
                            {
                                $sort: {
                                    isPlaying: -1,
                                },
                            },
                        ],
                        as: "currentSong",
                    },
                },
                {
                    $match: {
                        $expr: {
                            $gt: [{ $size: "$currentSong" }, 0],
                        },
                    },
                },
                {
                    $project: {
                        roomId: "$roomDetails.roomId",
                        name: {
                            $map: { input: "$admins", as: "admin", in: "$$admin.adminName" },
                        },
                        users: 1,
                        background: {
                            $let: {
                                vars: {
                                    filteredImages: {
                                        $filter: {
                                            input: { $arrayElemAt: ["$currentSong.songData.image", 0] },
                                            as: "bg",
                                            cond: { $eq: ["$$bg.quality", "500x500"] },
                                        },
                                    },
                                },
                                in: {
                                    $cond: {
                                        if: { $gt: [{ $size: "$$filteredImages" }, 0] },
                                        then: { $arrayElemAt: ["$$filteredImages.url", 0] }, // Extracting the URL directly
                                        else: "randomImageUrl", // Fallback URL
                                    },
                                },
                            },
                        },
                        updatedAt: 1,
                    },
                },
                {
                    $match: {
                        $expr: {
                            $gt: [{ $size: "$name" }, 0],
                        },
                    },
                },
                {
                    $sort: {
                        updatedAt: -1,
                    },
                },
                {
                    $limit: 4,
                },
                {
                    $project: {
                        _id: 0,
                        roomId: 1,
                        name: 1,
                        users: 1,
                        background: 1, // Keeping it simple, now just a string
                    },
                },
            ]);
            res.json(roomAdmins);
        }
        catch (error) {
            res.status(500).json({ message: "Server Error" });
        }
    });
}
