const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
require("dotenv").config();

const PORT = process.env.PORT;

app.use(express.static("public"));

app.get("/*", (req, res) => res.redirect("/"));

const usedNickname = {};
io.on("connection", (socket) => {
  socket.on("enterRoom", (nickname, sendAlert) => {
    if (usedNickname[nickname]) {
      sendAlert(false);
    } else {
      sendAlert(true);
      usedNickname[nickname] = true;
      socket["nickname"] = nickname;
      socket.join("room");
      io.to("room").emit("talk", { id: Date(), nickname, msg: `${nickname}님 께서 들어오셨습니다.` });
    }
  });

  socket.on("talk", ({ nickname, msg }) => {
    io.to("room").emit("talk", { id: Date(), nickname, msg });
  });

  socket.on("disconnecting", () => {
    if (socket.nickname) {
      delete usedNickname[socket.nickname];
      socket.to("room").emit("talk", { id: Date(), nickname: socket.nickname, msg: `${socket.nickname}님께서 나가셨습니다.` });
    }
  });
});

server.listen(PORT, () => console.log(PORT));
