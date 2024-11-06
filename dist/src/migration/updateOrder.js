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
const mongoose_1 = __importDefault(require("mongoose"));
const queueModel_1 = __importDefault(require("../models/queueModel"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Connect to your MongoDB database
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URL || "", {});
});
// Update order field in existing Queue documents by roomId
const updateQueueOrder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to the database
        yield connectDB();
        // Fetch distinct roomIds from the Queue collection
        const roomIds = yield queueModel_1.default.distinct("roomId");
        // Iterate over each roomId and update orders
        for (const roomId of roomIds) {
            // Fetch all Queue documents for the current roomId, sorted by createdAt
            const queues = yield queueModel_1.default.find({ roomId }).sort({ createdAt: 1 });
            let order = 1; // Initialize an order counter for this room
            for (const queue of queues) {
                // Assign an incremental order value to each document within the room
                yield queueModel_1.default.updateOne({ _id: queue._id }, { $set: { order } });
                order += 1; // Increment order for the next document
            }
        }
        console.log("All Queue documents have been updated with order by room.");
    }
    catch (error) {
        console.error("Error updating Queue order:", error);
    }
    finally {
        // Close the database connection
        mongoose_1.default.connection.close();
    }
});
// Run the update script
updateQueueOrder();
