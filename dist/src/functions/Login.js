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
exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_1 = __importDefault(require("../models/userModel"));
const jwt_secret = process.env.JWT_SECRET || "";
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const data = req.body; // Express uses req.body for JSON data
        const isAlready = yield userModel_1.default.findOne({ email: data.email });
        if (isAlready) {
            const user = yield userModel_1.default.findOneAndUpdate({ email: data.email }, { imageUrl: data.images[0].url, name: data.display_name }, { new: true });
            return proceed(res, isAlready, user);
        }
        else {
            const user = yield userModel_1.default.create({
                username: (_a = data.email) === null || _a === void 0 ? void 0 : _a.split("@gmail.com")[0],
                name: data.display_name,
                email: data.email,
                imageUrl: data.images[0].url,
            });
            if (user) {
                return proceed(res, user);
            }
        }
        return res.status(500).json({ success: false, data: {} });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, data: {}, message: error === null || error === void 0 ? void 0 : error.message });
    }
});
exports.login = login;
const proceed = (res, saved, user) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId: saved._id }, jwt_secret, {
        expiresIn: "7d",
    });
    // Set the cookie
    res.cookie("vibeIdR", accessToken, {
        httpOnly: true,
        sameSite: "none", // Change to 'None' if using cross-domain
        secure: true, // Ensure your server is running with HTTPS
        path: "/",
        // domain: ".getvibe.in",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Current date + 7 days
    });
    return res.json({ success: true, data: user || saved });
};
