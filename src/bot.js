const { Telegraf } = require('telegraf');
const ms = require('ms');
const { token } = require("../config/config");
const bot = new Telegraf(token);
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;
const { startTime, muteTime, parseTime, formatUptime } = require("./times.js")
const { allowedUsers } = require("./allowedUsers.js")
const { infbot, warns, warnsCount, muteHistory } = require("./botek.js")

infbot(bot)

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}`));

bot.launch();