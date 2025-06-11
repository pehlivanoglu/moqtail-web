const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

const rooms = {}; // { roomName: { socketId: username } }

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  secret: 'moqSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

app.get('/', (req, res) => {
  res.send('Welcome to the homepage!');
});

app.post('/join', (req, res) => {
  const { name, room } = req.body;
  if (!name || !room) return res.status(400).json({ error: 'Missing name or room' });
  if (
    rooms[room] &&
    Object.values(rooms[room]).includes(name)
  ) {
    return res.status(409).json({ error: 'Username already taken in this room.' });
  }
  req.session.user = { name, room };
  req.session.firstJoin = true;
  console.log('User connected with session ID:', req.sessionID);
  res.json({ success: true });
});

app.get('/session', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No session found' });
  if (req.session.firstJoin) {
    req.session.firstJoin = false; // Mark as not first join anymore
    return res.json(req.session.user);
  } else {
    return res.status(403).json({ error: 'Session already used' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.json({ success: true });
  });
});

// Socket.IO logic
io.on('connection', socket => {
  //console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ room, name }) => {
    if (!room || !name) return;

    socket.join(room);

    if (!rooms[room]) rooms[room] = {};

    rooms[room][socket.id] = name;

    io.to(room).emit('usersUpdate', Object.values(rooms[room]));

    console.log(`User ${name} joined room ${room}`);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (rooms[room]) {
        const userName = rooms[room][socket.id];
        delete rooms[room][socket.id];
        io.to(room).emit('usersUpdate', Object.values(rooms[room]));
        console.log(`User ${userName} left room ${room}`);
      }
    }
  });

  socket.on('disconnect', () => {
    //console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
