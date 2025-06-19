import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Room state: { [roomName]: { [socketId]: Participant } }
const rooms = {};

// Participant interface for reference:
// { id: string, name: string, isVideoOn: boolean, isAudioOn: boolean }

io.on('connection', (socket) => {
  // Join room event
  socket.on('join-room', ({ room, participant }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = {};
    rooms[room][socket.id] = { ...participant, id: socket.id };

    console.log(`Participant ${participant.name} joined room ${room} - ID: ${socket.id}`);

    // Notify all in room about new participant
    io.to(room).emit('participants-update', Object.values(rooms[room]));
  });

  // Toggle video/audio event
  socket.on('update-participant', ({ room, updates }) => {
    if (rooms[room] && rooms[room][socket.id]) {
      rooms[room][socket.id] = {
        ...rooms[room][socket.id],
        ...updates
      };
      io.to(room).emit('participants-update', Object.values(rooms[room]));
      console.log(`Updated participant ${socket.id} in room ${room}:`, rooms[room][socket.id]);
    }
  });

  // Handle disconnect
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (rooms[room] && rooms[room][socket.id]) {
        delete rooms[room][socket.id];
        io.to(room).emit('participants-update', Object.values(rooms[room]));
        // Clean up empty rooms
        if (Object.keys(rooms[room]).length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
