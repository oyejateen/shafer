import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3456",
    methods: ["GET", "POST"]
  }
});

app.use(cors());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create-room', (roomId) => {
    rooms.set(roomId, socket.id);
    socket.join(roomId);
    console.log(`Room created: ${roomId} by user: ${socket.id}`);
  });

  socket.on('join-room', (roomId) => {
    const hostId = rooms.get(roomId);
    if (hostId) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      io.to(hostId).emit('peer-joined', socket.id);
      socket.emit('joined-room', roomId);
    } else {
      console.log(`Room not found: ${roomId}`);
      socket.emit('room-not-found');
    }
  });

  socket.on('signal', ({ to, signal }) => {
    console.log(`Signaling from ${socket.id} to ${to}`);
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    rooms.forEach((value, key) => {
      if (value === socket.id) {
        rooms.delete(key);
        console.log(`Room ${key} deleted`);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});