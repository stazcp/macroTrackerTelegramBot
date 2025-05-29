/**
 * User Service
 * Handles user profile management
 */

const User = require('../db/models/user')

/**
 * Get or create a user by Telegram ID
 * @param {number} telegramId - Telegram user ID
 * @param {object} userData - User data from Telegram
 * @returns {Promise<object>} User document
 */
const getOrCreateUser = async (telegramId, userData = {}) => {
  let user = await User.findOne({ telegramId })

  if (!user) {
    // Create a new user if not found
    user = new User({
      telegramId,
      username: userData.username || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      calorieGoal: 2000, // Default values
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 65,
    })
    await user.save()
  } else {
    // Update last active timestamp
    user.lastActive = new Date()
    await user.save()
  }

  return user
}

/**
 * Update user's nutritional goals
 * @param {number} telegramId - Telegram user ID
 * @param {object} goals - Updated goals
 * @returns {Promise<object>} Updated user document
 */
const updateGoals = async (telegramId, goals) => {
  return User.findOneAndUpdate({ telegramId }, { $set: goals }, { new: true })
}

/**
 * Get user by Telegram ID
 * @param {number} telegramId - Telegram user ID
 * @returns {Promise<object|null>} User document or null if not found
 */
const getUserByTelegramId = async (telegramId) => {
  return User.findOne({ telegramId })
}

module.exports = {
  getOrCreateUser,
  updateGoals,
  getUserByTelegramId,
}
