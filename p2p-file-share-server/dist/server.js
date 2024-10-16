"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3456",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)());
const rooms = new Map();
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('create-room', (roomId) => {
        rooms.set(roomId, socket.id);
        socket.join(roomId);
        console.log(`Room created: ${roomId}`);
    });
    socket.on('join-room', (roomId) => {
        const hostId = rooms.get(roomId);
        if (hostId) {
            socket.join(roomId);
            io.to(hostId).emit('peer-joined', socket.id);
            console.log(`User joined room: ${roomId}`);
        }
        else {
            socket.emit('room-not-found');
        }
    });
    socket.on('signal', ({ to, signal }) => {
        io.to(to).emit('signal', { from: socket.id, signal });
    });
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        rooms.forEach((value, key) => {
            if (value === socket.id) {
                rooms.delete(key);
            }
        });
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
