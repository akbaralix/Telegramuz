// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // CORS ni o'rnatish

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Barcha manbalardan kelgan so'rovlarga ruxsat berish
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;

// CORS ni Express ilovasida ham ishga tushirish (agar static fayllar orqali kirilsa)
app.use(cors());

// Foydalanuvchilar sonini kuzatish uchun
let onlineUsers = {}; // { socketId: username }

app.use(express.static(path.join(__dirname, "public")));
io.on("connection", (socket) => {
  // Foydalanuvchi nomini qabul qilish
  socket.on("setUsername", (username) => {
    onlineUsers[socket.id] = username;
    // Boshqa foydalanuvchilarga yangi foydalanuvchi ulanganini xabar berish
    socket.broadcast.emit("userJoined", username);
    // Yangi foydalanuvchiga hozirgi onlayn foydalanuvchilar ro'yxatini yuborish
    socket.emit("onlineUsers", Object.values(onlineUsers));
    // Barchaga yangilangan onlayn foydalanuvchilar ro'yxatini yuborish
    io.emit("updateOnlineUsers", Object.values(onlineUsers));
  });

  // Clientdan xabar qabul qilish
  socket.on("chatMessage", (msg) => {
    const username = onlineUsers[socket.id];
    if (!username) {
      console.warn(
        `⚠️: Noma'lum foydalanuvchi (${socket.id}) xabar yubormoqchi bo‘ldi.`
      );
      return; // to‘xtatamiz
    }

    const timestamp = new Date().toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    io.emit("message", {
      user: username,
      text: msg,
      timestamp,
      senderId: socket.id,
    });
  });

  // Foydalanuvchi uzilganda
  socket.on("disconnect", () => {
    const disconnectedUsername = onlineUsers[socket.id];
    if (disconnectedUsername) {
      delete onlineUsers[socket.id];
      // Boshqa foydalanuvchilarga foydalanuvchi uzilganini xabar berish
      io.emit("userLeft", disconnectedUsername);
      // Barchaga yangilangan onlayn foydalanuvchilar ro'yxatini yuborish
      io.emit("updateOnlineUsers", Object.values(onlineUsers));
    } else {
      console.log(`🔥: ${socket.id} noma'lum foydalanuvchi uzildi`);
    }
  });
});

server.listen(port, () => {
  // console.log(`Server http://localhost:${port} portida ishlamoqda`);
});
