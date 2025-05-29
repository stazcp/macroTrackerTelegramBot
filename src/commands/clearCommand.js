/**
 * Clear Command Handler
 * Clears all food entries for the current day
 */

const userService = require('../services/userService')
const logService = require('../services/logService')
const confirmationService = require('../services/confirmationService')

module.exports = (bot) => async (msg) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    // Get user
    const user = await userService.getUserByTelegramId(telegramId)

    if (!user) {
      return bot.sendMessage(chatId, 'You need to start the bot first. Use /start command.')
    }

    // Get today's logs first to show what will be cleared
    const logs = await logService.getTodayLogs(telegramId)

    if (logs.length === 0) {
      return bot.sendMessage(chatId, "You don't have any food entries for today to clear! 🤷‍♂️")
    }

    // Calculate totals before clearing
    const totals = logService.calculateTotals(logs)

    // Store the confirmation state
    confirmationService.setPendingConfirmation(telegramId, 'clear', { logs, totals })

    // Create confirmation message
    const confirmationWords = confirmationService.getConfirmationWords()
    const confirmationMessage =
      `⚠️ *Confirm Clear Today's Food Log*\n\n` +
      `You are about to clear **${logs.length} food entries** from today:\n\n` +
      logs.map((log) => `• ${log.food}: ${log.calories} kcal`).join('\n') +
      `\n\n**Total to be cleared:**\n` +
      `📊 ${totals.calories} kcal | ${totals.protein}g protein | ${totals.carbs}g carbs | ${totals.fat}g fat\n\n` +
      `❗️ *This action cannot be undone!*\n\n` +
      `Reply with "${confirmationWords.join('", "')}" to proceed, or any other message to cancel.`

    // Send confirmation message
    await bot.sendMessage(chatId, confirmationMessage, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Error in clear command:', error)
    bot.sendMessage(chatId, 'Sorry, I had trouble processing your request. Please try again.')
  }
}

/**
 * Handle confirmation response for clear command
 * @param {object} bot - Telegram bot instance
 * @param {object} msg - Message object
 * @param {object} pendingConfirmation - Pending confirmation data
 */
const handleClearConfirmation = async (bot, msg, pendingConfirmation) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  // Use the centralized confirmation service to check for positive confirmation
  const isPositiveConfirmation = confirmationService.isPositiveConfirmation(msg.text)

  if (isPositiveConfirmation) {
    try {
      // Clear today's logs
      const result = await logService.clearTodayLogs(telegramId)

      if (result.deletedCount > 0) {
        bot.sendMessage(
          chatId,
          `✅ Successfully cleared ${result.deletedCount} food entries from today!\n\n` +
            `Your daily log has been reset. You can start fresh! 🔄`
        )
      } else {
        bot.sendMessage(
          chatId,
          '🤷‍♂️ No entries were found to clear. They may have already been removed.'
        )
      }
    } catch (error) {
      console.error("Error clearing today's logs:", error)
      bot.sendMessage(
        chatId,
        'Sorry, I had trouble clearing your food log. Please try again later.'
      )
    }
  } else {
    bot.sendMessage(chatId, '❌ Clear operation cancelled. Your food log remains unchanged.')
  }

  // Clear the pending confirmation
  confirmationService.clearPendingConfirmation(telegramId)
}

// Export the confirmation handler for use in bot.js
module.exports.handleClearConfirmation = handleClearConfirmation
