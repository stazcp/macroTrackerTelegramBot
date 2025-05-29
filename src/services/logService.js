/**
 * Log Service
 * Handles food logging and retrieval
 */

const FoodLog = require('../db/models/foodLog')
const foodService = require('./foodService')

/**
 * Log a food item for a user
 * @param {object} user - User document
 * @param {string} foodText - Food description
 * @returns {Promise<object>} Created food log
 */
const logFood = async (user, foodText) => {
  // Estimate calories and macros
  const nutritionInfo = foodService.estimateCalories(foodText)

  // Create new food log entry
  const foodLog = new FoodLog({
    userId: user._id,
    telegramId: user.telegramId,
    food: nutritionInfo.food,
    quantity: nutritionInfo.quantity,
    unit: 'serving', // Default unit
    calories: nutritionInfo.calories,
    protein: nutritionInfo.protein,
    carbs: nutritionInfo.carbs,
    fat: nutritionInfo.fat,
    date: new Date(),
    notes: nutritionInfo.note || '',
  })

  await foodLog.save()
  return { foodLog, nutritionInfo }
}

/**
 * Get today's food logs for a user
 * @param {number} telegramId - Telegram user ID
 * @returns {Promise<Array>} Array of food logs
 */
const getTodayLogs = async (telegramId) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return FoodLog.find({
    telegramId,
    date: { $gte: today, $lt: tomorrow },
  }).sort({ date: 1 })
}

/**
 * Get food logs for a user within a date range
 * @param {number} telegramId - Telegram user ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Array of food logs
 */
const getLogsHistory = async (telegramId, days = 7) => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  return FoodLog.find({
    telegramId,
    date: { $gte: startDate },
  }).sort({ date: -1 })
}

/**
 * Calculate totals from a list of food logs
 * @param {Array} logs - Array of food logs
 * @returns {object} Totals for calories and macros
 */
const calculateTotals = (logs) => {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/**
 * Get the most recent food log for a user (within last 5 minutes)
 * @param {number} telegramId - Telegram user ID
 * @returns {Promise<object|null>} Most recent food log or null
 */
const getMostRecentLog = async (telegramId) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  return FoodLog.findOne({
    telegramId,
    date: { $gte: fiveMinutesAgo },
  }).sort({ date: -1 })
}

/**
 * Update a recent food log entry
 * @param {string} logId - Food log ID to update
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} Updated food log
 */
const updateFoodLog = async (logId, updateData) => {
  return FoodLog.findByIdAndUpdate(logId, updateData, { new: true, runValidators: true })
}

/**
 * Delete a food log entry
 * @param {string} logId - Food log ID to delete
 * @returns {Promise<object>} Deleted food log
 */
const deleteFoodLog = async (logId) => {
  return FoodLog.findByIdAndDelete(logId)
}

module.exports = {
  logFood,
  getTodayLogs,
  getLogsHistory,
  calculateTotals,
  getMostRecentLog,
  updateFoodLog,
  deleteFoodLog,
}
