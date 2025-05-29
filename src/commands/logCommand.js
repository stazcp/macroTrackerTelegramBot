/**
 * Log Command Handler
 * Handles food logging
 */

const userService = require('../services/userService')
const logService = require('../services/logService')

module.exports =
  (bot) =>
  async (msg, match, silent = false) => {
    const chatId = msg.chat.id
    const telegramId = msg.from.id

    try {
      // Extract food text from command or message
      const foodText = match[1].trim()

      if (!foodText) {
        if (!silent) {
          return bot.sendMessage(chatId, 'Please specify a food to log. Example: /log 2 eggs')
        }
        return
      }

      // Get or create user
      const user = await userService.getOrCreateUser(telegramId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
      })

      // Log the food
      const { nutritionInfo } = await logService.logFood(user, foodText)

      // Only send confirmation message if not in silent mode
      if (!silent) {
        // Format quantity for display
        const quantityStr = nutritionInfo.quantity !== 1 ? `${nutritionInfo.quantity} × ` : ''

        // Send confirmation
        let message =
          `✅ Logged: ${quantityStr}${nutritionInfo.food}\n\n` +
          `🔢 *Nutrition*\n` +
          `Calories: ${nutritionInfo.calories} kcal\n` +
          `Protein: ${nutritionInfo.protein}g\n` +
          `Carbs: ${nutritionInfo.carbs}g\n` +
          `Fat: ${nutritionInfo.fat}g\n`

        // Add note if estimation is used
        if (nutritionInfo.source === 'estimated' && nutritionInfo.note) {
          message += `\n_Note: ${nutritionInfo.note}_`
        }

        // Add suggestion to check status
        message += '\n\nUse /status to see your daily totals.'

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
      }

      // Return nutrition info for use by other functions
      return { nutritionInfo }
    } catch (error) {
      console.error('Error logging food:', error)
      if (!silent) {
        bot.sendMessage(chatId, 'Sorry, I had trouble logging that food. Please try again.')
      }
      throw error
    }
  }
