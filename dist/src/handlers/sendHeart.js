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
exports.sendHeart = sendHeart;
const customEmit_1 = require("../lib/customEmit");
const lock_1 = require("../lib/lock");
function sendHeart(socket, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomInfo } = socket;
        if (!roomInfo)
            return;
        (0, customEmit_1.emitMessage)(socket, roomInfo.roomId, "heart", (0, lock_1.decrypt)(data));
    });
}
