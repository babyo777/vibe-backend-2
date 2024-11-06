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
exports.search = void 0;
const youtubei_js_1 = require("youtubei.js");
const ytMusic_1 = __importDefault(require("../lib/ytMusic"));
const lock_1 = require("../lib/lock");
const search = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Initialize YouTube music and Innertube
        const page = Number(req.query.page) || 0;
        const search = String(req.query.name) || "";
        if (!search)
            throw new Error("Search not found");
        let yt = null;
        if (search.startsWith("http")) {
            yt = yield youtubei_js_1.Innertube.create({
                cookie: process.env.COOKIES,
            });
        }
        // Fetch data concurrently
        const [data, ytSongs, yt2Songs] = yield Promise.all([
            !search.startsWith("http")
                ? fetch(`${process.env.BACKEND_URI}/api/search/songs?query=${encodeURIComponent(search)}&page=${page}&limit=5`, {
                    cache: "force-cache",
                }).then((res) => res.json())
                : null,
            page === 0 && !search.startsWith("http")
                ? ytMusic_1.default.searchSongs(search)
                : null,
            yt ? yt.search(search) : null,
        ]);
        const result = data || {
            data: {
                total: 0,
                start: 0,
                results: [],
            },
        };
        const songs = (ytSongs === null || ytSongs === void 0 ? void 0 : ytSongs.map((s) => ({
            id: s.videoId,
            name: s.name,
            artists: {
                primary: [
                    {
                        id: s.artist.artistId,
                        name: s.artist.name,
                        role: "",
                        image: [],
                        type: "artist",
                        url: "",
                    },
                ],
            },
            image: [
                {
                    quality: "500x500",
                    url: `https://wsrv.nl/?url=${s.thumbnails[s.thumbnails.length - 1].url
                        .replace(/w\\d+-h\\d+/, "w500-h500")
                        .replace("w120-h120", "w500-h500")}`,
                },
            ],
            source: "youtube",
            downloadUrl: [
                {
                    quality: "320kbps",
                    url: `${(0, lock_1.encrypt)(s.videoId)}`,
                },
            ],
        }))) || [];
        const songs2 = (yt2Songs === null || yt2Songs === void 0 ? void 0 : yt2Songs.results.filter((result) => result.type === "Video").slice(0, 1).map((s) => ({
            id: s.id,
            name: s.title.text,
            artists: {
                primary: [
                    {
                        id: s.author.id,
                        name: s.author.name,
                        role: "",
                        image: s.author.thumbnails.map((thumb) => ({
                            url: thumb.url,
                        })),
                        type: "artist",
                        url: s.author.url,
                    },
                ],
            },
            image: [
                {
                    quality: "500x500",
                    url: `https://wsrv.nl/?url=${s.thumbnails[s.thumbnails.length - 1].url
                        .replace(/w\\d+-h\\d+/, "w500-h500")
                        .replace("w120-h120", "w500-h500")}`,
                },
            ],
            source: "youtube",
            downloadUrl: [
                {
                    quality: "320kbps",
                    url: `${(0, lock_1.encrypt)(s.id)}`,
                },
            ],
        }))) || [];
        return res.json({
            data: Object.assign(Object.assign({}, result.data), { results: [
                    ...result.data.results.slice(0, 4),
                    ...songs2,
                    ...songs,
                    ...result.data.results.slice(4),
                ] }),
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "Failed to fetch", error: error.message });
    }
});
exports.search = search;
