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
exports.getPreviousSongByOrder = exports.getSongByOrder = exports.getTime = exports.shuffleArray = exports.cors = exports.homeResponse = exports.getListener = exports.getCurrentlyPlaying = exports.parseCookies = void 0;
exports.getQueuePipeline = getQueuePipeline;
const mongoose_1 = __importDefault(require("mongoose"));
const queueModel_1 = __importDefault(require("../models/queueModel"));
const roomUsers_1 = __importDefault(require("../models/roomUsers"));
const parseCookies = (cookieHeader) => {
    const cookies = {};
    if (!cookieHeader)
        return;
    cookieHeader.split(";").forEach((cookie) => {
        const [name, ...rest] = cookie.split("=");
        cookies[name.trim()] = decodeURIComponent(rest.join("="));
    });
    return cookies;
};
exports.parseCookies = parseCookies;
const getCurrentlyPlaying = (roomId_1, userId_1, ...args_1) => __awaiter(void 0, [roomId_1, userId_1, ...args_1], void 0, function* (roomId, userId, isPlaying = true) {
    try {
        const pipeline = [
            {
                $match: {
                    roomId: new mongoose_1.default.Types.ObjectId(roomId),
                },
            },
            {
                $lookup: {
                    from: "votes",
                    localField: "_id",
                    foreignField: "queueId",
                    as: "votes",
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { addedBy: "$songData.addedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                                imageUrl: 1,
                                username: 1,
                            },
                        },
                    ],
                    as: "addedByUser",
                },
            },
            {
                $unwind: {
                    path: "$addedByUser",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "songData.voteCount": { $size: "$votes" },
                    "songData.addedByUser": "$addedByUser",
                    "songData.order": "$order",
                    "songData.topVoterIds": {
                        $slice: [
                            {
                                $map: {
                                    input: {
                                        $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                                    },
                                    as: "vote",
                                    in: "$$vote.userId",
                                },
                            },
                            2,
                        ],
                    },
                    "songData.isVoted": {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: [{ $size: "$votes" }, 0] },
                                    { $ifNull: [userId, false] },
                                ],
                            },
                            then: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$votes",
                                                as: "vote",
                                                cond: {
                                                    $eq: [
                                                        "$$vote.userId",
                                                        new mongoose_1.default.Types.ObjectId(userId),
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            else: false,
                        },
                    },
                    isPlaying: "$isPlaying",
                    lastVoteTime: { $max: "$votes.createdAt" }, // Capture the latest vote timestamp
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "songData.topVoterIds",
                    foreignField: "_id",
                    as: "songData.topVoters",
                },
            },
            {
                $addFields: {
                    "songData.topVoters": {
                        $map: {
                            input: "$songData.topVoters",
                            as: "voter",
                            in: {
                                name: "$$voter.name",
                                username: "$$voter.username",
                                imageUrl: "$$voter.imageUrl",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    songData: 1,
                    isPlaying: 1,
                    lastVoteTime: 1, // Include lastVoteTime for sorting
                },
            },
        ];
        if (isPlaying) {
            pipeline.push({
                $sort: {
                    isPlaying: -1,
                },
            });
        }
        else {
            pipeline.push({
                $match: {
                    "songData.voteCount": { $gt: 0 },
                },
            }, {
                $sort: {
                    "songData.voteCount": -1, // Primary sort by vote count
                    lastVoteTime: 1, // Secondary sort by latest vote time (reverse)
                },
            });
        }
        pipeline.push({ $limit: 3 }, { $replaceRoot: { newRoot: "$songData" } }, { $project: { topVoterIds: 0 } });
        const songs = (yield queueModel_1.default.aggregate(pipeline)) || [];
        return songs;
    }
    catch (error) {
        console.error("Error fetching songs with vote counts:", error);
        return [];
    }
});
exports.getCurrentlyPlaying = getCurrentlyPlaying;
const getListener = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    const roomUsers = yield roomUsers_1.default.find({
        roomId: roomId,
        active: true,
    })
        .populate({
        path: "userId", // The path to populate
        select: "name username imageUrl", // Only select the 'name' and 'username' fields
    })
        .limit(17);
    const totalListeners = yield roomUsers_1.default.countDocuments({
        roomId: roomId,
        active: true,
    });
    return {
        totalUsers: totalListeners,
        currentPage: 1,
        roomUsers,
    };
});
exports.getListener = getListener;
exports.homeResponse = {
    info: "@babyo7_",
    code: "777",
    bio: "cursed",
};
exports.cors = {
    origin: true,
    credentials: true,
};
const shuffleArray = (queue) => {
    for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    return queue;
};
exports.shuffleArray = shuffleArray;
const getTime = () => {
    const now = new Date();
    const options = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Use 12-hour format with AM/PM
        timeZone: "Asia/Kolkata", // Set the time zone to IST
    };
    const timestamp = now.toLocaleTimeString("en-US", options); // Get the time in 'hh:mm AM/PM' format
    return timestamp;
};
exports.getTime = getTime;
const getSongByOrder = (roomId, order, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Primary pipeline to find the next song in ascending order
        const primaryPipeline = [
            {
                $match: {
                    roomId: new mongoose_1.default.Types.ObjectId(roomId),
                    order: { $gt: order }, // Only songs with order greater than the specified order
                },
            },
            { $sort: { order: 1 } }, // Ascending to get the next song
            { $limit: 3 }, // Get only the next song
            {
                $lookup: {
                    from: "votes",
                    localField: "_id",
                    foreignField: "queueId",
                    as: "votes",
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { addedBy: "$songData.addedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                                imageUrl: 1,
                                username: 1,
                            },
                        },
                    ],
                    as: "addedByUser",
                },
            },
            {
                $unwind: {
                    path: "$addedByUser",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "songData.voteCount": { $size: "$votes" },
                    "songData.order": "$order",
                    "songData.addedByUser": "$addedByUser",
                    "songData.topVoterIds": {
                        $slice: [
                            {
                                $map: {
                                    input: {
                                        $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                                    },
                                    as: "vote",
                                    in: "$$vote.userId",
                                },
                            },
                            2, // Top 2 users
                        ],
                    },
                    "songData.isVoted": {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: [{ $size: "$votes" }, 0] },
                                    { $ifNull: [userId, false] },
                                ],
                            },
                            then: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$votes",
                                                as: "vote",
                                                cond: {
                                                    $eq: [
                                                        "$$vote.userId",
                                                        new mongoose_1.default.Types.ObjectId(userId),
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            else: false,
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "songData.topVoterIds",
                    foreignField: "_id",
                    as: "songData.topVoters",
                },
            },
            {
                $addFields: {
                    "songData.topVoters": {
                        $map: {
                            input: "$songData.topVoters",
                            as: "voter",
                            in: {
                                name: "$$voter.name",
                                username: "$$voter.username",
                                imageUrl: "$$voter.imageUrl",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    songData: 1,
                },
            },
            { $replaceRoot: { newRoot: "$songData" } },
        ];
        // Execute primary pipeline to get the next song
        let songs = yield queueModel_1.default.aggregate(primaryPipeline);
        // If no song is found, use fallback pipeline for the lowest order song
        if (songs.length === 0) {
            const fallbackPipeline = [
                {
                    $match: { roomId: new mongoose_1.default.Types.ObjectId(roomId) },
                },
                { $sort: { order: 1 } }, // Ascending order for the lowest order song
                { $limit: 3 },
                {
                    $lookup: {
                        from: "votes",
                        localField: "_id",
                        foreignField: "queueId",
                        as: "votes",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        let: { addedBy: "$songData.addedBy" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    name: 1,
                                    imageUrl: 1,
                                    username: 1,
                                },
                            },
                        ],
                        as: "addedByUser",
                    },
                },
                {
                    $unwind: {
                        path: "$addedByUser",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $addFields: {
                        "songData.voteCount": { $size: "$votes" },
                        "songData.order": "$order",
                        "songData.addedByUser": "$addedByUser",
                        "songData.isVoted": {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gt: [{ $size: "$votes" }, 0] },
                                        { $ifNull: [userId, false] },
                                    ],
                                },
                                then: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$votes",
                                                    as: "vote",
                                                    cond: {
                                                        $eq: [
                                                            "$$vote.userId",
                                                            new mongoose_1.default.Types.ObjectId(userId),
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                else: false,
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        songData: 1,
                    },
                },
                { $replaceRoot: { newRoot: "$songData" } },
            ];
            // Execute fallback pipeline to get the lowest order song
            songs = yield queueModel_1.default.aggregate(fallbackPipeline);
        }
        return songs.length > 0 ? songs : []; // Return the song or null if none found
    }
    catch (error) {
        console.error("Error fetching the next song by order:", error);
        throw error;
    }
});
exports.getSongByOrder = getSongByOrder;
const getPreviousSongByOrder = (roomId, order, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Primary pipeline to find the previous song in descending order
        const primaryPipeline = [
            {
                $match: {
                    roomId: new mongoose_1.default.Types.ObjectId(roomId),
                    order: { $lt: order }, // Only songs with order less than the specified order
                },
            },
            { $sort: { order: -1 } }, // Descending to get the previous song
            { $limit: 1 }, // Get only the previous song
            {
                $lookup: {
                    from: "votes",
                    localField: "_id",
                    foreignField: "queueId",
                    as: "votes",
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { addedBy: "$songData.addedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                                imageUrl: 1,
                                username: 1,
                            },
                        },
                    ],
                    as: "addedByUser",
                },
            },
            {
                $unwind: {
                    path: "$addedByUser",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "songData.voteCount": { $size: "$votes" },
                    "songData.order": "$order",
                    "songData.addedByUser": "$addedByUser",
                    "songData.isVoted": {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: [{ $size: "$votes" }, 0] },
                                    { $ifNull: [userId, false] },
                                ],
                            },
                            then: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$votes",
                                                as: "vote",
                                                cond: {
                                                    $eq: [
                                                        "$$vote.userId",
                                                        new mongoose_1.default.Types.ObjectId(userId),
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                    0,
                                ],
                            },
                            else: false,
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "songData.topVoterIds",
                    foreignField: "_id",
                    as: "songData.topVoters",
                },
            },
            {
                $addFields: {
                    "songData.topVoters": {
                        $map: {
                            input: "$songData.topVoters",
                            as: "voter",
                            in: {
                                name: "$$voter.name",
                                username: "$$voter.username",
                                imageUrl: "$$voter.imageUrl",
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    songData: 1,
                },
            },
            { $replaceRoot: { newRoot: "$songData" } },
        ];
        // Execute primary pipeline to get the previous song
        let songs = yield queueModel_1.default.aggregate(primaryPipeline);
        // If no previous song is found, use fallback pipeline for the highest order song
        if (songs.length === 0) {
            const fallbackPipeline = [
                {
                    $match: { roomId: new mongoose_1.default.Types.ObjectId(roomId) },
                },
                { $sort: { order: -1 } }, // Descending to get the highest order song
                { $limit: 1 },
                {
                    $lookup: {
                        from: "votes",
                        localField: "_id",
                        foreignField: "queueId",
                        as: "votes",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        let: { addedBy: "$songData.addedBy" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    name: 1,
                                    imageUrl: 1,
                                    username: 1,
                                },
                            },
                        ],
                        as: "addedByUser",
                    },
                },
                {
                    $unwind: {
                        path: "$addedByUser",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $addFields: {
                        "songData.voteCount": { $size: "$votes" },
                        "songData.order": "$order",
                        "songData.addedByUser": "$addedByUser",
                        "songData.isVoted": {
                            $cond: {
                                if: {
                                    $and: [
                                        { $gt: [{ $size: "$votes" }, 0] },
                                        { $ifNull: [userId, false] },
                                    ],
                                },
                                then: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$votes",
                                                    as: "vote",
                                                    cond: {
                                                        $eq: [
                                                            "$$vote.userId",
                                                            new mongoose_1.default.Types.ObjectId(userId),
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                else: false,
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        songData: 1,
                    },
                },
                { $replaceRoot: { newRoot: "$songData" } },
            ];
            // Execute fallback pipeline to get the highest order song
            songs = yield queueModel_1.default.aggregate(fallbackPipeline);
        }
        return songs.length > 0 ? songs : []; // Return the song or null if none found
    }
    catch (error) {
        console.error("Error fetching the previous song by order:", error);
        throw error;
    }
});
exports.getPreviousSongByOrder = getPreviousSongByOrder;
// Function to construct the aggregation pipeline
function getQueuePipeline(roomId, userId, page = 1, limit = 50, search = "") {
    const pipeline = [
        {
            $match: {
                roomId: new mongoose_1.default.Types.ObjectId(roomId),
            },
        },
        {
            $lookup: {
                from: "votes",
                localField: "_id",
                foreignField: "queueId",
                as: "votes",
            },
        },
        {
            $lookup: {
                from: "users",
                let: { addedBy: "$songData.addedBy" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", { $toObjectId: "$$addedBy" }] },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            name: 1,
                            imageUrl: 1,
                            username: 1,
                        },
                    },
                ],
                as: "addedByUser",
            },
        },
        {
            $unwind: {
                path: "$addedByUser",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                "songData.voteCount": { $size: "$votes" },
                "songData.addedByUser": "$addedByUser",
                "songData.order": "$order",
                "songData.topVoterIds": {
                    $slice: [
                        {
                            $map: {
                                input: {
                                    $sortArray: { input: "$votes", sortBy: { createdAt: -1 } },
                                },
                                as: "vote",
                                in: "$$vote.userId",
                            },
                        },
                        2,
                    ],
                },
                "songData.isVoted": {
                    $cond: {
                        if: {
                            $and: [
                                { $gt: [{ $size: "$votes" }, 0] },
                                { $ifNull: [userId, false] },
                            ],
                        },
                        then: {
                            $gt: [
                                {
                                    $size: {
                                        $filter: {
                                            input: "$votes",
                                            as: "vote",
                                            cond: {
                                                $eq: [
                                                    "$$vote.userId",
                                                    new mongoose_1.default.Types.ObjectId(userId),
                                                ],
                                            },
                                        },
                                    },
                                },
                                0,
                            ],
                        },
                        else: false,
                    },
                },
                isPlaying: "$isPlaying",
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "songData.topVoterIds",
                foreignField: "_id",
                as: "songData.topVoters",
            },
        },
        {
            $addFields: {
                "songData.topVoters": {
                    $map: {
                        input: "$songData.topVoters",
                        as: "voter",
                        in: {
                            name: "$$voter.name",
                            username: "$$voter.username",
                            imageUrl: "$$voter.imageUrl",
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                songData: 1,
                isPlaying: 1,
                order: 1,
            },
        },
        {
            $sort: {
                order: -1,
            },
        },
        {
            $replaceRoot: { newRoot: "$songData" },
        },
        {
            $project: {
                topVoterIds: 0,
            },
        },
    ];
    if (search && search.trim() !== "") {
        pipeline.push({
            $match: {
                name: { $regex: search, $options: "i" },
            },
        });
    }
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });
    return pipeline;
}
