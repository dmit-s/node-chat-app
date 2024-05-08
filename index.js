const express = require("express");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();

const route = require("./route");

app.use(cors({ origin: "*" }));
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e9,
});

// data
let users = [];
let messages = [];

io.on("connection", (socket) => {
  socket.on("addUser", (user) => {
    socket.userId = user.id;

    users.push(user);

    socket.broadcast.emit("newUser", user);

    io.to(socket.id).emit("users", users);

    io.to(socket.id).emit("messages", messages);
  });

  socket.on("addMessage", ({ text, pic }) => {
    const { id, name, avatar } = users.find((u) => u.id === socket.userId);

    const newMessage = {
      message: {
        text,
        pic,
      },
      sender: {
        id,
        name,
        avatar,
      },
    };

    messages.push(newMessage);

    io.emit("newMessage", newMessage);
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.id !== socket.userId);
    io.emit("leaveUser", socket.userId);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
