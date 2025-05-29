const TelegramBot = require('node-telegram-bot-api')
const aiService = require('./services/aiService')
const conversationService = require('./services/conversationService')
const confirmationService = require('./services/confirmationService')

// Command handlers
const startCommand = require('./commands/startCommand')
const helpCommand = require('./commands/helpCommand')
const logCommand = require('./commands/logCommand')
const statusCommand = require('./commands/statusCommand')
const goalsCommand = require('./commands/goalsCommand')
const historyCommand = require('./commands/historyCommand')
const clearCommand = require('./commands/clearCommand')

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN

// Create a bot instance (WITHOUT automatic polling)
const bot = new TelegramBot(token, { polling: false })

// Register command handlers
bot.onText(/\/start/, startCommand(bot))
bot.onText(/\/help/, helpCommand(bot))
bot.onText(/\/log (.+)/, logCommand(bot))
bot.onText(/\/status/, statusCommand(bot))
bot.onText(/\/goals(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(\d+))?(?:\s+(\d+))?/, goalsCommand(bot))
bot.onText(/\/history(?:\s+(\d+))?/, historyCommand(bot))
bot.onText(/\/clear/, clearCommand(bot))

// Handle conversational messages
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) {
    return
  }

  // If it's a text message, process it intelligently
  if (msg.text) {
    try {
      // Check if user has a pending confirmation
      const pendingConfirmation = confirmationService.getPendingConfirmation(msg.from.id)

      if (
        pendingConfirmation &&
        confirmationService.isConfirmationResponse(msg.text, pendingConfirmation)
      ) {
        // Handle confirmation response based on type
        if (pendingConfirmation.type === 'clear') {
          return await clearCommand.handleClearConfirmation(bot, msg, pendingConfirmation)
        }
        // Future: Add other confirmation types here
        return
      }

      // Send "typing" indicator
      bot.sendChatAction(msg.chat.id, 'typing')

      // Get conversation context for better understanding
      const recentContext = conversationService.getRecentContext(msg.from.id)

      // Detect user intent using AI with conversation context
      const intentResult = await aiService.detectIntent(msg.text, recentContext)
      console.log('Intent detected:', intentResult)

      if (intentResult.intent === 'log_food' && intentResult.confidence > 0.5) {
        // User is trying to log food
        const foodData = await aiService.parseFoodMessage(msg.text)

        // Create a friendly response
        let response = 'Got it! I logged:\n\n'
        let totalCalories = 0

        foodData.foods.forEach((food) => {
          response += `🍽️ ${food.item} (${food.quantity})\n`
          response += `   📊 ${food.estimatedCalories} cal | ${food.protein}g protein | ${food.carbs}g carbs | ${food.fat}g fat\n\n`
          totalCalories += food.estimatedCalories
        })

        response += `Total: ${totalCalories} calories added to today's log! 📈`

        // Send the parsed response
        bot.sendMessage(msg.chat.id, response)

        // Log each food item using the new approach with pre-parsed data
        const userService = require('./services/userService')
        const logService = require('./services/logService')

        try {
          // Get or create user
          const user = await userService.getOrCreateUser(msg.from.id, {
            username: msg.from.username,
            firstName: msg.from.first_name,
            lastName: msg.from.last_name,
          })

          // Log each food item with the AI-parsed nutrition data
          for (const food of foodData.foods) {
            try {
              await logService.logFood(user, food) // Pass the pre-parsed food object
            } catch (error) {
              console.error('Error logging food item:', error)
            }
          }
        } catch (error) {
          console.error('Error getting user or logging foods:', error)
        }

        // Store conversation context with food data for potential modifications
        conversationService.storeContext(msg.from.id, msg.text, intentResult.intent, { foodData })
      } else if (intentResult.intent === 'modify_food' && intentResult.confidence > 0.5) {
        // User is modifying/clarifying a recent food entry
        const logService = require('./services/logService')

        // Get the most recent food log from database
        const recentLog = await logService.getMostRecentLog(msg.from.id)

        if (recentLog) {
          try {
            // Use AI to handle the modification
            const modificationResult = await aiService.handleFoodModification(
              msg.text,
              {
                item: recentLog.food,
                quantity: recentLog.quantity,
                calories: recentLog.calories,
                protein: recentLog.protein,
                carbs: recentLog.carbs,
                fat: recentLog.fat,
              },
              recentContext
            )

            if (modificationResult.action === 'update') {
              // Update the existing log entry
              const updatedLog = await logService.updateFoodLog(recentLog._id, {
                food: modificationResult.combined_food.item,
                calories: modificationResult.combined_food.estimatedCalories,
                protein: modificationResult.combined_food.protein,
                carbs: modificationResult.combined_food.carbs,
                fat: modificationResult.combined_food.fat,
                notes: modificationResult.combined_food.explanation,
              })

              bot.sendMessage(
                msg.chat.id,
                `✅ Updated your ${recentLog.food} entry!\n\n` +
                  `🍽️ ${modificationResult.combined_food.item}\n` +
                  `📊 ${modificationResult.combined_food.estimatedCalories} cal | ` +
                  `${modificationResult.combined_food.protein}g protein | ` +
                  `${modificationResult.combined_food.carbs}g carbs | ` +
                  `${modificationResult.combined_food.fat}g fat\n\n` +
                  `${
                    modificationResult.combined_food.explanation
                      ? modificationResult.combined_food.explanation
                      : ''
                  }`
              )
            } else {
              // Add as separate item
              const foodData = await aiService.parseFoodMessage(msg.text)

              let response = 'Got it! I also logged:\n\n'
              let totalCalories = 0

              foodData.foods.forEach((food) => {
                response += `🍽️ ${food.item} (${food.quantity})\n`
                response += `   📊 ${food.estimatedCalories} cal | ${food.protein}g protein | ${food.carbs}g carbs | ${food.fat}g fat\n\n`
                totalCalories += food.estimatedCalories
              })

              response += `Additional ${totalCalories} calories logged! 📈`
              bot.sendMessage(msg.chat.id, response)

              // Log the additional items using the new approach
              try {
                const userService = require('./services/userService')

                // Get or create user
                const user = await userService.getOrCreateUser(msg.from.id, {
                  username: msg.from.username,
                  firstName: msg.from.first_name,
                  lastName: msg.from.last_name,
                })

                // Log each additional food item with the AI-parsed nutrition data
                for (const food of foodData.foods) {
                  try {
                    await logService.logFood(user, food) // Pass the pre-parsed food object
                  } catch (error) {
                    console.error('Error logging additional food item:', error)
                  }
                }
              } catch (error) {
                console.error('Error getting user or logging additional foods:', error)
              }
            }
          } catch (error) {
            console.error('Error handling food modification:', error)
            // Fallback: treat as new food item
            bot.sendMessage(
              msg.chat.id,
              "I couldn't update your previous entry, but I can log this as a separate item. What would you like me to do?"
            )
          }
        } else {
          // No recent food to modify
          bot.sendMessage(
            msg.chat.id,
            "I don't see any recent food entries to modify. Could you be more specific about what you'd like to log?"
          )
        }

        // Store conversation context
        conversationService.storeContext(msg.from.id, msg.text, intentResult.intent)
      } else if (intentResult.intent === 'food_question' && intentResult.confidence > 0.5) {
        // User is asking about food/nutrition

        // Get user context for personalized advice
        let userContext = null
        try {
          const userService = require('./services/userService')
          const logService = require('./services/logService')

          const user = await userService.getUserByTelegramId(msg.from.id)
          if (user) {
            const todayLogs = await logService.getTodayLogs(msg.from.id)
            const totals = logService.calculateTotals(todayLogs)

            userContext = {
              goals: {
                calories: user.calorieGoal,
                protein: user.proteinGoal,
                carbs: user.carbsGoal,
                fat: user.fatGoal,
              },
              today: totals,
              remaining: {
                calories: Math.max(0, user.calorieGoal - totals.calories),
                protein: Math.max(0, user.proteinGoal - totals.protein),
                carbs: Math.max(0, user.carbsGoal - totals.carbs),
                fat: Math.max(0, user.fatGoal - totals.fat),
              },
            }
          }
        } catch (error) {
          console.error('Error getting user context:', error)
        }

        // Generate AI response with context and conversation history
        const response = await aiService.answerFoodQuestion(msg.text, userContext, recentContext)
        bot.sendMessage(msg.chat.id, response)

        // Store conversation context
        conversationService.storeContext(msg.from.id, msg.text, intentResult.intent)
      } else if (aiService.isAboutFood(msg.text)) {
        // Fallback: still food-related but unclear intent
        bot.sendMessage(
          msg.chat.id,
          "I can see you're talking about food! 🍽️\n\n" +
            "📝 To log food: Tell me what you ate (e.g., 'I had 2 eggs')\n" +
            "❓ To ask questions: Ask me anything about nutrition (e.g., 'What should I eat more of?')\n" +
            '📊 To check status: Use /status to see your daily totals\n\n' +
            'What would you like to do?'
        )

        // Store conversation context
        conversationService.storeContext(msg.from.id, msg.text, 'food_unclear')
      } else {
        // Not about food, send a helpful message
        bot.sendMessage(
          msg.chat.id,
          "Hey! I'm here to help track your food and answer nutrition questions. Try:\n\n" +
            '📝 "Just had a chicken breast with rice"\n' +
            '❓ "What should I eat more of today?"\n' +
            '📊 Use /status to see your progress\n\n' +
            'Or check /help for all commands! 😊'
        )

        // Store conversation context
        conversationService.storeContext(msg.from.id, msg.text, intentResult.intent || 'other')
      }
    } catch (error) {
      console.error('Error processing message:', error)
      bot.sendMessage(
        msg.chat.id,
        'Sorry, I had trouble understanding that. Try using /log [food item] or check /help for commands!'
      )
    }
  }
})

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error)
})

module.exports = bot
