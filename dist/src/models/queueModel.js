"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roomModel_1 = __importDefault(require("./roomModel"));
const userModel_1 = __importDefault(require("./userModel"));
const queueSchema = new mongoose_1.default.Schema({
    roomId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: roomModel_1.default,
        required: true,
    },
    isPlaying: {
        type: Boolean,
        default: false,
    },
    songData: {
        type: {
            id: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            artists: {
                type: {
                    primary: [
                        {
                            name: {
                                type: String,
                            },
                        },
                    ],
                },
            },
            image: {
                type: mongoose_1.default.Schema.Types.Mixed,
            },
            source: {
                type: String,
            },
            downloadUrl: {
                type: mongoose_1.default.Schema.Types.Mixed,
            },
            addedBy: {
                type: String,
                ref: userModel_1.default,
            },
            queueId: {
                type: String,
            },
        },
        required: true,
    },
    order: {
        type: Number,
        unique: true,
        required: true,
    },
}, { timestamps: true });
queueSchema.index({ roomId: 1, order: 1 });
const Queue = ((_a = mongoose_1.default.models) === null || _a === void 0 ? void 0 : _a.Queue) || mongoose_1.default.model("Queue", queueSchema);
exports.default = Queue;
