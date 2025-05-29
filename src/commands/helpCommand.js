/**
 * Help Command Handler
 * Displays available commands and usage instructions
 */

module.exports = (bot) => (msg) => {
  const chatId = msg.chat.id

  const helpMessage =
    `🔍 *Available Commands*\n\n` +
    `/start - Initialize the bot\n` +
    `/help - Show this help message\n` +
    `/log [food] - Log a food item (e.g., "/log 2 eggs")\n` +
    `/status - View today's calorie and macro totals\n` +
    `/goals - View your current nutritional goals\n` +
    `/goals [calories] [protein] [carbs] [fat] - Set new goals\n` +
    `/history - View your food log history (default: 7 days)\n` +
    `/history [days] - View history for specific number of days\n` +
    `/clear - Clear all food entries for today (with confirmation)\n\n` +
    `📝 *Quick Logging*\n` +
    `Simply send any food item as a message to log it automatically.\n\n` +
    `Example: "banana" or "2 slices of bread"\n\n` +
    `💡 *Tips*\n` +
    `- For accurate tracking, be specific with food descriptions\n` +
    `- Include quantities when possible (e.g., "2 eggs" instead of just "eggs")\n` +
    `- Check your /status regularly to stay on track with your goals`

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' })
}
