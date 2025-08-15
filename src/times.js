const startTime = Date.now();

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

function formatUptime(msTime) {
    let seconds = Math.floor(msTime / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    return `${days}д ${hours % 24}ч ${minutes % 60}м ${seconds % 60}с`;
}

module.exports = { startTime, muteTime, parseTime, formatUptime }