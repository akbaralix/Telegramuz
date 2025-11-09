// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // CORS ni o'rnatish

// Foydalanuvchining oxirgi xabar vaqtini saqlash
const messageTimestamps = {}; // { socket.id: [timestamp1, timestamp2, ...] }
// Temporary ban (ixtiyoriy, hozir faqat disconnect qilamiz)
const usersBanUntil = {}; // { username: timestamp }

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
      return;
    }

    // RATE LIMIT LOGIC
    const now = Date.now();
    const windowMs = 1000; // 1 soniya oynasi
    const limit = 2; // 1 soniyada 2 tadan ko'p xabar yubormaslik

    if (!messageTimestamps[socket.id]) messageTimestamps[socket.id] = [];
    const arr = messageTimestamps[socket.id];

    // faqat oxirgi 1 soniya ichidagi xabarlarni saqlaymiz
    const recent = arr.filter((t) => now - t < windowMs);
    recent.push(now);
    messageTimestamps[socket.id] = recent;

    if (recent.length > limit) {
      // LIMIT Buzildi → foydalanuvchini uzatish
      socket.emit(
        "systemMessage",
        "Siz juda tez xabar yubordingiz — server sizni uzatdi."
      );
      socket.disconnect(true);

      // tozalash
      delete messageTimestamps[socket.id];
      return;
    }

    // Agar limit buzilmagan bo‘lsa, normal xabar yuborish
    const timestamp = new Date().toLocaleTimeString("uz-UZ", {
      timeZone: "Asia/Tashkent",
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
