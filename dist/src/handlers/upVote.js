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
exports.default = upVote;
const voteModel_1 = __importDefault(require("../models/voteModel"));
const error_1 = require("./error");
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
function upVote(io, socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { roomInfo, userInfo } = socket;
            if (!roomInfo || !userInfo || !data)
                throw new Error("Login required");
            const value = (0, lock_1.decrypt)(data);
            if (!value.queueId) {
                throw new Error("Queue ID is missing in the data.");
            }
            const isAlreadyVoted = yield voteModel_1.default.findOne({
                roomId: roomInfo._id,
                userId: userInfo.id,
                queueId: value.queueId,
            });
            if (!isAlreadyVoted) {
                console.log(`User ${userInfo.id} is voting for queueId ${value.queueId}`);
                yield voteModel_1.default.create({
                    roomId: roomInfo._id,
                    userId: userInfo.id,
                    queueId: value.queueId,
                });
            }
            else {
                console.log(`User ${userInfo.id} is un-voting for queueId ${value.queueId}`);
                yield voteModel_1.default.deleteOne({
                    roomId: roomInfo._id,
                    userId: userInfo.id,
                    queueId: value.queueId,
                });
            }
            (0, customEmit_1.broadcast)(io, roomInfo.roomId, "update", "update");
        }
        catch (error) {
            console.log("UPVOTE ERROR:", error.message);
            (0, error_1.errorHandler)(socket, error.message || "An unexpected error occurred");
        }
    });
}
