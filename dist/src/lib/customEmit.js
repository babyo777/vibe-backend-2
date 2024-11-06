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
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitMessage = emitMessage;
exports.broadcast = broadcast;
const lock_1 = require("./lock");
function emitMessage(socket, roomId, emit, message) {
    return __awaiter(this, void 0, void 0, function* () {
        socket.to(roomId).emit(emit, (0, lock_1.encrypt)(message));
    });
}
function broadcast(io, roomId, emit, message) {
    return __awaiter(this, void 0, void 0, function* () {
        io.to(roomId).emit(emit, (0, lock_1.encrypt)(message));
    });
}
