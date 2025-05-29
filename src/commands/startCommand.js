/**
 * Start Command Handler
 * Initializes the bot for a new user
 */

const userService = require('../services/userService')

module.exports = (bot) => async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    // Get or create user
    const userData = {
      username: msg.from.username || '',
      firstName: msg.from.first_name || '',
      lastName: msg.from.last_name || '',
    }

    await userService.getOrCreateUser(telegramId, userData)

    // Send welcome message
    const message =
      `👋 Welcome to Macro Tracker Bot, ${userData.firstName}!\n\n` +
      `I'll help you track your daily calorie intake and macronutrients. Here's how to use me:\n\n` +
      `- Simply send me a food item to log it (e.g., "apple" or "2 eggs")\n` +
      `- Use /log [food] to log a specific food\n` +
      `- Check /status to see your daily totals\n` +
      `- Set goals with /goals [calories] [protein] [carbs] [fat]\n\n` +
      `Type /help anytime to see all available commands.`

    bot.sendMessage(chatId, message)
  } catch (error) {
    console.error('Error in start command:', error)
    bot.sendMessage(chatId, 'An error occurred while starting the bot. Please try again.')
  }
}
