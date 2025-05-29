/**
 * Confirmation Service
 * Handles tracking of pending user confirmations to prevent conflicts with message processing
 */

// Store pending confirmations
const pendingConfirmations = new Map()

// Centralized confirmation words
const CONFIRMATION_WORDS = ['YES', 'Y', 'CONFIRM', 'OK']
const CANCELLATION_WORDS = ['NO', 'N', 'CANCEL', 'STOP', 'ABORT']

/**
 * Set a pending confirmation for a user
 * @param {number} telegramId - Telegram user ID
 * @param {string} type - Type of confirmation (e.g., 'clear')
 * @param {object} data - Additional data for the confirmation
 */
const setPendingConfirmation = (telegramId, type, data = {}) => {
  pendingConfirmations.set(telegramId, {
    type,
    data,
    timestamp: Date.now(),
  })
}

/**
 * Check if a user has a pending confirmation
 * @param {number} telegramId - Telegram user ID
 * @returns {object|null} Pending confirmation object or null
 */
const getPendingConfirmation = (telegramId) => {
  return pendingConfirmations.get(telegramId) || null
}

/**
 * Clear a pending confirmation for a user
 * @param {number} telegramId - Telegram user ID
 */
const clearPendingConfirmation = (telegramId) => {
  pendingConfirmations.delete(telegramId)
}

/**
 * Check if a message is a confirmation response (positive or negative)
 * @param {string} text - Message text
 * @param {object} pendingConfirmation - Pending confirmation object
 * @returns {boolean} Whether the message is a confirmation response
 */
const isConfirmationResponse = (text, pendingConfirmation) => {
  if (!pendingConfirmation || !text) return false

  const upperText = text.toUpperCase().trim()

  return CONFIRMATION_WORDS.includes(upperText) || CANCELLATION_WORDS.includes(upperText)
}

/**
 * Check if a message is a positive confirmation
 * @param {string} text - Message text
 * @returns {boolean} Whether the message is a positive confirmation
 */
const isPositiveConfirmation = (text) => {
  if (!text) return false

  const upperText = text.toUpperCase().trim()
  return CONFIRMATION_WORDS.includes(upperText)
}

/**
 * Get the list of confirmation words for display purposes
 * @returns {Array} Array of confirmation words
 */
const getConfirmationWords = () => {
  return [...CONFIRMATION_WORDS]
}

/**
 * Clean up expired confirmations (older than 30 seconds)
 */
const cleanupExpiredConfirmations = () => {
  const now = Date.now()
  const thirtySecondsAgo = now - 30000

  for (const [telegramId, confirmation] of pendingConfirmations.entries()) {
    if (confirmation.timestamp < thirtySecondsAgo) {
      pendingConfirmations.delete(telegramId)
    }
  }
}

// Clean up expired confirmations every 60 seconds
setInterval(cleanupExpiredConfirmations, 60000)

module.exports = {
  setPendingConfirmation,
  getPendingConfirmation,
  clearPendingConfirmation,
  isConfirmationResponse,
  isPositiveConfirmation,
  getConfirmationWords,
  cleanupExpiredConfirmations,
}
