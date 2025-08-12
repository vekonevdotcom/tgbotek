const { Telegraf } = require('telegraf');
const ms = require('ms');
const { token } = require("../config/config");
const bot = new Telegraf(token);

let warns = {};
let muteHistory = {};

function muteTime(days) {
    return Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);
}

function parseTime(str) {
    if (!str) return 0;
    try {
        return Math.floor((Date.now() + ms(str)) / 1000);
    } catch {
        return 0;
    }
}

bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    if (!message.startsWith('.')) return;
    const args = message.split(' ');
    const cmd = args[0].toLowerCase();
    const timeArg = args[1];
    const reply = ctx.message.reply_to_message;
    const chatId = ctx.chat.id;

    if (cmd === '.me') {
        return ctx.reply(`Твой ID: ${ctx.from.id}\nНик: ${ctx.from.first_name} (${ctx.from.username || "без username"})`);
    }

    if (cmd === '.hi') {
        return ctx.replyWithSticker("CAACAgIAAxkBAAIBHmiTGj9ENs-0xDk2KPdkXgu4yewpAALgVQACV_wBSubd-bDyhHK4NgQ");
    }

    if (!reply) {
        return ctx.reply('Ответь на сообщение пользователя.');
    }

    const userId = reply.from.id;
    const username = reply.from.username || reply.from.first_name;

    try {

        if (cmd === '.warn') {
            if (!warns[userId]) warns[userId] = 0;
            warns[userId]++;

            await ctx.reply(`⚠️ ${username} получил предупреждение (${warns[userId]}/3)`);

            if (warns[userId] >= 3) {
                if (!muteHistory[userId]) muteHistory[userId] = 0;
                muteHistory[userId]++;

                const days = muteHistory[userId];
                const untilDate = muteTime(days);

                await ctx.telegram.restrictChatMember(chatId, userId, {
                    until_date: untilDate,
                    permissions: {
                        can_send_messages: false,
                        can_send_media_messages: false,
                        can_send_polls: false,
                        can_send_other_messages: false,
                        can_add_web_page_previews: false,
                        can_change_info: false,
                        can_invite_users: false,
                        can_pin_messages: false
                    }
                });

                await ctx.reply(`⛔ ${username} получил мут на ${days} дн.`);
                warns[userId] = 0;
            }
        }

        if (cmd === '.clearwarn') {
            if (!warns[userId] || warns[userId] === 0) {
                return ctx.reply(`ℹ️ У ${username} нет предупреждений.`);
            }
            warns[userId] = 0;
            return ctx.reply(`✅ Все предупреждения для ${username} были удалены.`);
        }
        if (cmd === '.t') {
            return ctx.sendDice
        }

        if (cmd === '.ban') {
            await ctx.telegram.banChatMember(chatId, userId, { until_date: parseTime(timeArg) || undefined });
            return ctx.reply(`Пользователь забанен ${timeArg ? `на ${timeArg}` : 'навсегда'} ✅`);
        }

        if (cmd === '.unban') {
            await ctx.telegram.unbanChatMember(chatId, userId);
            return ctx.reply('Пользователь разбанен ✅');
        }

        if (cmd === '.kick') {
            await ctx.telegram.unbanChatMember(chatId, userId);
            return ctx.reply('Пользователь кикнут ✅');
        }

        if (cmd === '.mute') {
            const untilDate = parseTime(timeArg);
            if (!untilDate) return ctx.reply('Укажи время для мута, например `.mute 10m`');
            await ctx.telegram.restrictChatMember(chatId, userId, {
                until_date: untilDate,
                permissions: {
                    can_send_messages: false,
                    can_send_media_messages: false,
                    can_send_polls: false,
                    can_send_other_messages: false,
                    can_add_web_page_previews: false,
                    can_change_info: false,
                    can_invite_users: false,
                    can_pin_messages: false
                }
            });
            return ctx.reply(`Пользователь замучен на ${timeArg} ✅`);
        }

        if (cmd === '.unmute') {
            await ctx.telegram.restrictChatMember(chatId, userId, {
                permissions: {
                    can_send_messages: true,
                    can_send_media_messages: true,
                    can_send_polls: true,
                    can_send_other_messages: true,
                    can_add_web_page_previews: true,
                    can_change_info: false,
                    can_invite_users: true,
                    can_pin_messages: true
                }
            });
            return ctx.reply('Пользователь размучен ✅');
        }

    } catch (err) {
        console.error(err);
        ctx.reply('Ошибка: у бота нет прав или он не админ ❌');
    }
});

bot.launch();