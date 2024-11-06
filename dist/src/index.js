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
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./lib/db");
const handleDisconnect_1 = require("./handlers/handleDisconnect");
const sendMessage_1 = require("./handlers/sendMessage");
const middleware_1 = require("./handlers/middleware");
const utils_1 = require("./lib/utils");
const sendHeart_1 = require("./handlers/sendHeart");
const handleProgress_1 = require("./handlers/handleProgress");
const handleSeek_1 = require("./handlers/handleSeek");
const handlePlay_1 = require("./handlers/handlePlay");
const deleteSong_1 = __importDefault(require("./handlers/deleteSong"));
const deleteAll_1 = require("./handlers/deleteAll");
const upVote_1 = __importDefault(require("./handlers/upVote"));
const bulkDelete_1 = require("./handlers/bulkDelete");
const nextSong_1 = require("./handlers/nextSong");
const songEnded_1 = require("./handlers/songEnded");
const prevSong_1 = require("./handlers/prevSong");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const router_1 = __importDefault(require("./router/router"));
const express_rate_limit_1 = require("express-rate-limit");
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 2 * 60 * 1000, // 15 minutes
    limit: 70, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    validate: {
        xForwardedForHeader: false,
    },
});
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: utils_1.cors,
    httpCompression: true,
});
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(limiter);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)()); // For cookie parsing
app.use(router_1.default);
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    socket.compress(true);
    yield (0, middleware_1.middleware)(socket, next);
}));
io.on("connection", (socket) => {
    const eventHandlers = {
        message: (message) => __awaiter(void 0, void 0, void 0, function* () { return (0, sendMessage_1.sendMessage)(io, socket, message); }),
        heart: (heart) => __awaiter(void 0, void 0, void 0, function* () { return (0, sendHeart_1.sendHeart)(socket, heart); }),
        progress: (progress) => __awaiter(void 0, void 0, void 0, function* () { return (0, handleProgress_1.handleProgress)(socket, progress); }),
        seek: (seek) => __awaiter(void 0, void 0, void 0, function* () { return (0, handleSeek_1.handleSeek)(socket, seek); }),
        play: (play) => __awaiter(void 0, void 0, void 0, function* () { return (0, handlePlay_1.handlePlay)(io, socket, play); }),
        update: () => { var _a; return io.to(((_a = socket.roomInfo) === null || _a === void 0 ? void 0 : _a.roomId) || "").emit("update"); },
        deleteSong: (data) => __awaiter(void 0, void 0, void 0, function* () { return (0, deleteSong_1.default)(io, socket, data); }),
        deleteAll: () => __awaiter(void 0, void 0, void 0, function* () { return (0, deleteAll_1.deleteAll)(io, socket); }),
        upvote: (upvote) => __awaiter(void 0, void 0, void 0, function* () { return (0, upVote_1.default)(io, socket, upvote); }),
        bulkDelete: (data) => __awaiter(void 0, void 0, void 0, function* () { return (0, bulkDelete_1.bulkDelete)(io, socket, data); }),
        playNext: () => __awaiter(void 0, void 0, void 0, function* () { return (0, nextSong_1.PlayNextSong)(io, socket); }),
        songEnded: () => __awaiter(void 0, void 0, void 0, function* () { return (0, songEnded_1.SongEnded)(io, socket); }),
        playPrev: () => __awaiter(void 0, void 0, void 0, function* () { return (0, prevSong_1.PlayPrevSong)(io, socket); }),
    };
    for (const [event, handler] of Object.entries(eventHandlers)) {
        socket.on(event, handler);
    }
    socket.on("disconnect", () => (0, handleDisconnect_1.handleDisconnect)(socket));
});
(0, db_1.runServer)(server);
