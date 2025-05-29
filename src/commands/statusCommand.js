/**
 * Status Command Handler
 * Shows today's calorie and macro consumption
 */

const userService = require('../services/userService')
const logService = require('../services/logService')

module.exports = (bot) => async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    // Get user
    const user = await userService.getUserByTelegramId(telegramId)

    if (!user) {
      return bot.sendMessage(chatId, 'You need to start the bot first. Use /start command.')
    }

    // Get today's logs
    const logs = await logService.getTodayLogs(telegramId)

    if (logs.length === 0) {
      return bot.sendMessage(
        chatId,
        "You haven't logged any food today. Use /log [food] to log something!"
      )
    }

    // Calculate totals
    const totals = logService.calculateTotals(logs)

    // Calculate remaining calories
    const remainingCalories = Math.max(0, user.calorieGoal - totals.calories)

    // Calculate percentages of goals
    const caloriePercent = Math.round((totals.calories / user.calorieGoal) * 100)
    const proteinPercent = Math.round((totals.protein / user.proteinGoal) * 100)
    const carbsPercent = Math.round((totals.carbs / user.carbsGoal) * 100)
    const fatPercent = Math.round((totals.fat / user.fatGoal) * 100)

    // Create progress bars
    const createProgressBar = (percent) => {
      // Clamp the percentage between 0 and 100 to prevent negative bars
      const clampedPercent = Math.max(0, Math.min(100, percent))
      const filledBars = Math.floor(clampedPercent / 10)
      const emptyBars = 10 - filledBars

      // Add indicator if over 100%
      const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)
      return percent > 100 ? progressBar + ' 🔥' : progressBar
    }

    // Format and send the response
    const message =
      `📊 *Today's Nutrition Summary*\n\n` +
      `Calories: ${totals.calories} / ${user.calorieGoal} kcal (${caloriePercent}%)\n` +
      `${createProgressBar(caloriePercent)}\n\n` +
      `Protein: ${totals.protein}g / ${user.proteinGoal}g (${proteinPercent}%)\n` +
      `${createProgressBar(proteinPercent)}\n\n` +
      `Carbs: ${totals.carbs}g / ${user.carbsGoal}g (${carbsPercent}%)\n` +
      `${createProgressBar(carbsPercent)}\n\n` +
      `Fat: ${totals.fat}g / ${user.fatGoal}g (${fatPercent}%)\n` +
      `${createProgressBar(fatPercent)}\n\n` +
      `Remaining Calories: ${remainingCalories} kcal\n\n` +
      `_Today's food log (${logs.length} items):_\n` +
      logs.map((log) => `- ${log.food}: ${log.calories} kcal`).join('\n')

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Error getting status:', error)
    bot.sendMessage(chatId, 'Sorry, I had trouble getting your status. Please try again.')
  }
}
