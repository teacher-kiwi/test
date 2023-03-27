const app = require("express")();
require("dotenv").config();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello Qoddi!, I'm kiwi!");
});

app.listen(PORT, () => {
  console.log(PORT);
});
