/**
 * History Command Handler
 * Shows food log history for a specified period
 */

const userService = require('../services/userService')
const logService = require('../services/logService')

module.exports = (bot) => async (msg, match) => {
  const chatId = msg.chat.id
  const telegramId = msg.from.id

  try {
    // Get user
    const user = await userService.getUserByTelegramId(telegramId)

    if (!user) {
      return bot.sendMessage(chatId, 'You need to start the bot first. Use /start command.')
    }

    // Parse days parameter (default to 7)
    let days = 7
    if (match[1] && !isNaN(parseInt(match[1]))) {
      days = Math.min(Math.max(parseInt(match[1]), 1), 30) // Limit between 1-30 days
    }

    // Get logs for the specified period
    const logs = await logService.getLogsHistory(telegramId, days)

    if (logs.length === 0) {
      return bot.sendMessage(chatId, `You haven't logged any food in the last ${days} day(s).`)
    }

    // Group logs by date
    const logsByDate = {}
    logs.forEach((log) => {
      const dateStr = log.date.toISOString().split('T')[0]
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = []
      }
      logsByDate[dateStr].push(log)
    })

    // Calculate daily totals
    const dailyTotals = {}
    Object.entries(logsByDate).forEach(([date, dayLogs]) => {
      dailyTotals[date] = logService.calculateTotals(dayLogs)
    })

    // Format the message
    let message = `📜 *Food Log History (${days} days)*\n\n`

    Object.entries(logsByDate)
      .sort((a, b) => new Date(b[0]) - new Date(a[0])) // Sort by date descending
      .forEach(([date, dayLogs]) => {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })

        const totals = dailyTotals[date]

        message += `*${formattedDate}* - ${totals.calories} kcal\n`
        dayLogs.forEach((log) => {
          message += `- ${log.food}: ${log.calories} kcal\n`
        })
        message += `\n`
      })

    // Send the history
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Error retrieving history:', error)
    bot.sendMessage(chatId, 'Sorry, I had trouble retrieving your history. Please try again.')
  }
}
