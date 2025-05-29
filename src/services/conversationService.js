/**
 * Conversation Service
 * Maintains simple conversational context for better user experience
 */

class ConversationService {
  constructor() {
    // Simple in-memory storage for conversation context
    // In production, this could be stored in Redis or database
    this.conversations = new Map()

    // Clean up old conversations every hour
    setInterval(() => {
      this.cleanupOldConversations()
    }, 3600000) // 1 hour
  }

  /**
   * Store conversation context for a user
   * @param {number} userId - Telegram user ID
   * @param {string} message - User message
   * @param {string} intent - Detected intent
   * @param {object} context - Additional context
   */
  storeContext(userId, message, intent, context = {}) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, {
        messages: [],
        lastActivity: new Date(),
      })
    }

    const userConversation = this.conversations.get(userId)

    // Keep only last 5 messages for context
    if (userConversation.messages.length >= 5) {
      userConversation.messages.shift()
    }

    userConversation.messages.push({
      message,
      intent,
      context,
      timestamp: new Date(),
    })

    userConversation.lastActivity = new Date()
  }

  /**
   * Get conversation context for a user
   * @param {number} userId - Telegram user ID
   * @returns {object|null} Conversation context
   */
  getContext(userId) {
    return this.conversations.get(userId) || null
  }

  /**
   * Get recent message context for better AI understanding
   * @param {number} userId - Telegram user ID
   * @returns {string} Formatted context for AI
   */
  getRecentContext(userId) {
    const conversation = this.getContext(userId)
    if (!conversation || conversation.messages.length === 0) {
      return ''
    }

    // Return last 2-3 messages for context
    const recentMessages = conversation.messages.slice(-3)
    return recentMessages.map((msg) => `User: ${msg.message} (Intent: ${msg.intent})`).join('\n')
  }

  /**
   * Check if user was recently asking food questions
   * @param {number} userId - Telegram user ID
   * @returns {boolean}
   */
  wasRecentlyAskingFoodQuestions(userId) {
    const conversation = this.getContext(userId)
    if (!conversation || conversation.messages.length === 0) {
      return false
    }

    // Check if any of the last 2 messages were food questions
    const recentMessages = conversation.messages.slice(-2)
    return recentMessages.some((msg) => msg.intent === 'food_question')
  }

  /**
   * Clean up conversations older than 24 hours
   */
  cleanupOldConversations() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    for (const [userId, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < oneDayAgo) {
        this.conversations.delete(userId)
      }
    }
  }

  /**
   * Clear conversation context for a user
   * @param {number} userId - Telegram user ID
   */
  clearContext(userId) {
    this.conversations.delete(userId)
  }
}

// Export singleton instance
module.exports = new ConversationService()
