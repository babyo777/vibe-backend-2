"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ytmusic_api_1 = __importDefault(require("ytmusic-api"));
const ytmusic = new ytmusic_api_1.default();
ytmusic.initialize({
    cookies: process.env.COOKIES,
});
exports.default = ytmusic;
