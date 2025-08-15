const { startTime, muteTime, parseTime, formatUptime } = require("./times.js")
const { allowedUsers } = require("./allowedUsers.js")
let warns = {};
let muteHistory = {};
function infbot(bot) {
    bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    if (!message.startsWith('.')) return;

    const args = message.split(' ');
    const cmd = args[0].toLowerCase();
    const timeArg = args[1];
    const reply = ctx.message.reply_to_message;
    const chatId = ctx.chat.id;

    if (cmd === '.me') {
        let target = ctx.from;
        if (args[1]) {
            const searchName = args[1].toLowerCase();
            const historyLimit = 50;
            let foundUser = null;
            let offsetId = 0;

            for (let i = 0; i < historyLimit; i++) {
                try {
                    const history = await ctx.telegram.getChatHistory(chatId, { limit: 1, offset_id: offsetId });
                    if (!history.length) break;
                    const msg = history[0];
                    offsetId = msg.message_id;
                    if (msg.from.username && msg.from.username.toLowerCase() === searchName) {
                        foundUser = msg.from;
                        break;
                    }
                } catch (err) { console.error(err); }
            }
            if (foundUser) {
                target = foundUser;
            } else {
                return ctx.reply(`❌ Пользователь "${searchName}" не найден в последних ${historyLimit} сообщениях.`);
            }
        }
        const warnsCount = warns[target.id] || 0;
        const isAdmin = allowedUsers.includes(target.id);
        return ctx.reply(
            `📋 Профиль:\n🆔 ID: ${target.id}\n👤 Ник: ${target.first_name} (${target.username || "без username"})\n⚠️ Предупреждения: ${warnsCount}/3\n🔑 Статус: ${isAdmin ? "Админ 🎖️" : "Пользователь 👤"}`
        );
    }

    if (cmd === '.dice') return ctx.sendDice();

    if (cmd === '.joke') {
        const datah = await fetch("https://official-joke-api.appspot.com/random_joke");
        const joke = await datah.json();
        return ctx.reply(`${ctx.from.username || ctx.from.first_name} спрашивает:\n${joke.setup} - ${joke.punchline}`);
    }

    if (cmd === '.hi') {
        return ctx.replyWithSticker("CAACAgIAAxkBAAIBHmiTGj9ENs-0xDk2KPdkXgu4yewpAALgVQACV_wBSubd-bDyhHK4NgQ");
    }

    if (cmd === '.ping') {
        const start = Date.now();
        await ctx.reply('🏓 Пинг...');
        const ping = Date.now() - start;
        return ctx.reply(`📡 Пинг: ${ping}ms`);
    }

    if (cmd === '.uptime') {
        return ctx.reply(`⏳ Аптайм бота: ${formatUptime(Date.now() - startTime)}`);
    }
    
    if (cmd === '.admins') {
        const adminList = allowedUsers.map(id => `🆔 ${id}`).join("\n");
        return ctx.reply(`🎖️ Список админов:\n${adminList}`);
    }
    
    if (cmd === '.server') {
        return ctx.reply(`💻 Сервер жив.\n⏳ Аптайм: ${formatUptime(Date.now() - startTime)}`);
    }

    const adminCommands = ['.warn', '.clearwarn', '.ban', '.unban', '.kick', '.mute', '.unmute', '.del', '.purge', '.lock', '.unlock'];
    if (adminCommands.includes(cmd) && !allowedUsers.includes(ctx.from.id)) {
        return ctx.reply('❌ У вас нет прав для этой команды.');
    }

    if (cmd === '.cmds') {
    const userIsAdmin = allowedUsers.includes(ctx.from.id);

    const commonCmds = [
        ".me [username] — информация о себе или другом",
        ".dice — кинуть кубик 🎲",
        ".joke — случайная шутка",
        ".hi — стикер-привет",
        ".ping — пинг бота",
        ".uptime — аптайм бота",
        ".admins — список админов",
        ".server — информация о сервере"
    ];

    const adminCmds = [
        ".warn — выдать предупреждение",
        ".clearwarn — очистить предупреждения",
        ".ban [время] — бан пользователя",
        ".unban — разбан",
        ".kick — кикнуть",
        ".mute <время> — замутить",
        ".unmute — размутить",
        ".del — удалить сообщение",
        ".purge [число] — удалить несколько сообщений",
        ".lock — закрыть чат",
        ".unlock — открыть чат"
    ];

    if (userIsAdmin) {
        return ctx.reply(
            `📜 Список всех команд:\n\n` +
            `💬 Обычные:\n${commonCmds.join("\n")}\n\n` +
            `🛡 Админские:\n${adminCmds.join("\n")}`
        );
    } else {
        return ctx.reply(
            `📜 Доступные команды:\n` +
            commonCmds.join("\n")
        );
    }
    }

    if (cmd === '.lock') {
        await ctx.telegram.setChatPermissions(chatId, { can_send_messages: false });
        return ctx.reply('🔒 Чат заблокирован.');
    }

    if (cmd === '.unlock') {
        await ctx.telegram.setChatPermissions(chatId, { can_send_messages: true });
        return ctx.reply('🔓 Чат разблокирован.');
    }
    
// YAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYA
    if (adminCommands.includes(cmd) && !reply) {
        return ctx.reply('Ответь на сообщение пользователя.');
    }
// YAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYAYA
    const userId = reply?.from?.id;
    const username = reply?.from?.username || reply?.from?.first_name;
    if (cmd === '.admin') {
        if (!args[1]) {
            let adminList = allowedUsers.map(id => `🆔 ${id}`).join("\n");
            return ctx.reply(
                `🛡 Список админов:\n` +
                (adminList || "Нет админов")
            );
        }
        
        if (!allowedUsers.includes(ctx.from.id)) {
            return ctx.reply('❌ У вас нет прав для этой команды.');
        }
        
        if (!reply) {
            return ctx.reply('❌ Ответьте на сообщение пользователя.');
        }
        
        const targetId = reply.from.id;
        const targetName = reply.from.username || reply.from.first_name;
        
        if (args[1].toLowerCase() === 'add') {
            if (allowedUsers.includes(targetId)) {
                return ctx.reply(`ℹ️ ${targetName} уже является админом.`);
            }
            allowedUsers.push(targetId);
            return ctx.reply(`✅ ${targetName} назначен админом.`);
        }

        if (args[1].toLowerCase() === 'del') {
            if (!allowedUsers.includes(targetId)) {
                return ctx.reply(`ℹ️ ${targetName} не является админом.`);
            }
           allowedUsers = allowedUsers.filter(id => id !== targetId);
            return ctx.reply(`❌ ${targetName} больше не админ.`);
        }
        }


    try {
        if (cmd === '.warn') {
            if (!warns[userId]) warns[userId] = 0;
            warns[userId]++;
            await ctx.reply(`⚠️ ${username} получил предупреждение (${warns[userId]}/3)`);
            if (warns[userId] >= 3) {
                if (!muteHistory[userId]) muteHistory[userId] = 0;
                muteHistory[userId]++;
                const days = muteHistory[userId];
                await ctx.telegram.restrictChatMember(chatId, userId, {
                    until_date: muteTime(days),
                    permissions: { can_send_messages: false }
                });
                await ctx.reply(`⛔ ${username} получил мут на ${days} дн.`);
                warns[userId] = 0;
            }
        }

        if (cmd === '.clearwarn') {
            warns[userId] = 0;
            return ctx.reply(`✅ Все предупреждения для ${username} удалены.`);
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
                permissions: { can_send_messages: false }
            });
            return ctx.reply(`Пользователь замучен на ${timeArg} ✅`);
        }

        if (cmd === '.unmute') {
            await ctx.telegram.restrictChatMember(chatId, userId, {
                permissions: { can_send_messages: true }
            });
            return ctx.reply('Пользователь размучен ✅');
        }

        if (cmd === '.del') {
            await ctx.deleteMessage(reply.message_id);
            return ctx.reply('🗑 Сообщение удалено.');
        }

        if (cmd === '.purge') {
            let count = parseInt(timeArg) || 5;
            for (let i = 0; i < count; i++) {
                await ctx.deleteMessage(ctx.message.message_id - i);
            }
            return ctx.reply(`🧹 Очищено ${count} сообщений.`);
        }


    } catch (err) {
        console.error(err);
        ctx.reply('Ошибка: у бота нет прав или пользователь недоступен ❌');
    }
});
}

module.exports = { infbot, warns, muteHistory };