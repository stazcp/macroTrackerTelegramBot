require('dotenv').config()
const bot = require('./bot')
const connectDB = require('./db/connection')

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Connected to MongoDB')

    // Start the bot
    bot.startPolling()
    console.log('Macro Tracker Bot is running...')
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err)
    process.exit(1)
  })

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Bot is shutting down...')
  bot.stopPolling()
  process.exit(0)
})
