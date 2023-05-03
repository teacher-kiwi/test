const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
require("dotenv").config();

const PORT = process.env.PORT;

app.use(express.static("public"));

app.get("/*", (req, res) => res.redirect("/"));

const usedNickname = {};
const roomList = {};
io.on("connection", (socket) => {
  socket.on("makeName", (nickname, ok) => {
    if (usedNickname[nickname]) {
      ok(false);
    } else {
      ok(true);
      usedNickname[nickname] = true;
      socket["nickname"] = nickname;
    }

    io.emit("userCount", { count: Object.keys(usedNickname).length });
    socket.emit("roomList", { roomList: Object.keys(roomList) });
  });

  socket.on("makeRoom", (roomName, ok) => {
    if (roomList[roomName]) {
      ok(false);
    } else {
      ok(true);
      socket["roomName"] = roomName;
      const nickname = socket.nickname;
      roomList[roomName] = nickname;
      socket.join(roomName);

      io.to(roomName).emit(
        "updateUser",
        [...io.sockets.adapter.rooms.get(roomName)].map((id) => io.sockets.sockets.get(id).nickname)
      );
      io.to(roomName).emit("talk", { id: Date(), nickname: "키위🥝", msg: `${nickname}님께서 들어오셨습니다.` });
    }

    io.emit("roomList", { roomList: Object.keys(roomList) });
  });

  socket.on("enterRoom", (roomName, ok) => {
    if (roomList[roomName]) {
      ok(true);
      socket["roomName"] = roomName;
      const nickname = socket.nickname;
      socket.join(roomName);
      io.to(roomName).emit(
        "updateUser",
        [...io.sockets.adapter.rooms.get(roomName)].map((id) => io.sockets.sockets.get(id).nickname)
      );
      io.to(roomName).emit("talk", { id: Date(), nickname: "키위🥝", msg: `${nickname}님께서 들어오셨습니다.` });
    } else {
      ok(false);
    }
  });

  socket.on("outRoom", () => {
    const roomName = socket.roomName;
    if (socket.nickname === roomList[roomName]) {
      io.to(roomName).emit("deleteRoom");
      [...io.sockets.adapter.rooms.get(roomName)].forEach((id) => delete io.sockets.sockets.get(id)["roomName"]);
      io.socketsLeave(roomName);
      delete socket["roomName"];
      delete roomList[roomName];
      io.emit("roomList", { roomList: Object.keys(roomList) });
    } else {
      socket.leave(roomName);
      delete socket["roomName"];
      io.to(roomName).emit(
        "updateUser",
        [...io.sockets.adapter.rooms.get(roomName)].map((id) => io.sockets.sockets.get(id).nickname)
      );
      io.to(roomName).emit("talk", { id: Date(), nickname: "키위🥝", msg: `${socket.nickname}님께서 나가셨습니다.` });
    }
  });

  socket.on("talk", ({ msg }) => {
    io.to(socket.roomName).emit("talk", { id: Date(), nickname: socket.nickname, msg });
  });

  socket.on("disconnecting", () => {
    if (socket.nickname) {
      const nickname = socket.nickname;
      delete usedNickname[nickname];
      io.emit("userCount", { count: Object.keys(usedNickname).length });

      if (socket.roomName) {
        const roomName = socket.roomName;
        if (nickname === roomList[roomName]) {
          io.to(roomName).emit("deleteRoom");
          [...io.sockets.adapter.rooms.get(roomName)].forEach((id) => delete io.sockets.sockets.get(id)["roomName"]);
          io.socketsLeave(roomName);
          delete roomList[roomName];
          io.emit("roomList", { roomList: Object.keys(roomList) });
        } else {
          socket.to(roomName).emit("talk", { id: Date(), nickname: "키위🥝", msg: `${nickname}님께서 나가셨습니다.` });
          socket.leave(roomName);
          delete socket["roomName"];
          io.to(roomName).emit(
            "updateUser",
            [...io.sockets.adapter.rooms.get(roomName)].map((id) => io.sockets.sockets.get(id).nickname)
          );
        }
      }
    }
  });
});

server.listen(PORT, () => console.log(PORT));
