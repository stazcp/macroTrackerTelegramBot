/**
 * Goals Command Handler
 * Set or view nutritional goals
 */

const userService = require('../services/userService')

module.exports = (bot) => async (msg, match) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    // Get user
    const user = await userService.getUserByTelegramId(telegramId)

    if (!user) {
      return bot.sendMessage(chatId, 'You need to start the bot first. Use /start command.')
    }

    // Check if user is setting new goals or just viewing
    if (match[1] || match[2] || match[3] || match[4]) {
      // User is setting new goals
      const goals = {}

      // Parse goals from command
      if (match[1] && !isNaN(parseInt(match[1]))) {
        goals.calorieGoal = parseInt(match[1])
      }

      if (match[2] && !isNaN(parseInt(match[2]))) {
        goals.proteinGoal = parseInt(match[2])
      }

      if (match[3] && !isNaN(parseInt(match[3]))) {
        goals.carbsGoal = parseInt(match[3])
      }

      if (match[4] && !isNaN(parseInt(match[4]))) {
        goals.fatGoal = parseInt(match[4])
      }

      // Update goals
      const updatedUser = await userService.updateGoals(telegramId, goals)

      // Send confirmation
      const message =
        `✅ Goals updated!\n\n` +
        `Calories: ${updatedUser.calorieGoal} kcal\n` +
        `Protein: ${updatedUser.proteinGoal}g\n` +
        `Carbs: ${updatedUser.carbsGoal}g\n` +
        `Fat: ${updatedUser.fatGoal}g`

      bot.sendMessage(chatId, message)
    } else {
      // User is viewing current goals
      const message =
        `🎯 *Your Nutritional Goals*\n\n` +
        `Calories: ${user.calorieGoal} kcal\n` +
        `Protein: ${user.proteinGoal}g\n` +
        `Carbs: ${user.carbsGoal}g\n` +
        `Fat: ${user.fatGoal}g\n\n` +
        `To update your goals, use:\n` +
        `/goals [calories] [protein] [carbs] [fat]\n\n` +
        `Example: /goals 2000 150 200 65`

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    }
  } catch (error) {
    console.error('Error managing goals:', error)
    bot.sendMessage(chatId, 'Sorry, I had trouble managing your goals. Please try again.')
  }
}
