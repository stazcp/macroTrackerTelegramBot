const Groq = require('groq-sdk')

class AIService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Cache common food items to save API calls
    this.foodCache = new Map()
    this.intentCache = new Map()
  }

  // Enhanced intent detection using AI
  async detectIntent(message, conversationContext = '') {
    // Check cache first
    const cacheKey = (conversationContext + message).toLowerCase().trim()
    if (this.intentCache.has(cacheKey)) {
      return this.intentCache.get(cacheKey)
    }

    const prompt = `
Analyze this message and determine the user's intent. Return only a JSON object with the intent type.

${conversationContext ? `Recent conversation context:\n${conversationContext}\n` : ''}

Current message: "${message}"

Intent categories:
- "log_food": User is reporting food they ate/consumed (e.g., "I ate an apple", "had 2 eggs", "just finished lunch")
- "food_question": User is asking about food, nutrition, or what to eat (e.g., "what should I eat?", "what do I need more of?", "is this healthy?")
- "other": Not food-related

Return format:
{
  "intent": "log_food" | "food_question" | "other",
  "confidence": 0.0-1.0
}
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 150,
      })

      const response = completion.choices[0]?.message?.content
      const intentData = JSON.parse(response)

      // Cache the result (with shorter cache for context-aware results)
      if (this.intentCache.size > 500) {
        const firstKey = this.intentCache.keys().next().value
        this.intentCache.delete(firstKey)
      }
      this.intentCache.set(cacheKey, intentData)

      return intentData
    } catch (error) {
      console.error('Intent detection error:', error)
      // Fallback to basic keyword matching
      return this.basicIntentDetection(message)
    }
  }

  // Fallback intent detection
  basicIntentDetection(message) {
    const lowerMessage = message.toLowerCase()

    // Question indicators
    const questionWords = ['what', 'how', 'should', 'need', 'can', 'which', '?']
    const adviceWords = ['recommend', 'suggest', 'advice', 'help', 'should eat']

    // Food consumption indicators
    const consumptionWords = ['ate', 'had', 'consumed', 'finished', 'just', 'eating']

    const hasQuestionWords = questionWords.some((word) => lowerMessage.includes(word))
    const hasAdviceWords = adviceWords.some((word) => lowerMessage.includes(word))
    const hasConsumptionWords = consumptionWords.some((word) => lowerMessage.includes(word))

    if (hasQuestionWords || hasAdviceWords) {
      return { intent: 'food_question', confidence: 0.7 }
    } else if (hasConsumptionWords) {
      return { intent: 'log_food', confidence: 0.6 }
    } else {
      return { intent: 'other', confidence: 0.5 }
    }
  }

  // Simple food-related check for backward compatibility
  isAboutFood(message) {
    const foodKeywords = [
      'ate',
      'eat',
      'eating',
      'had',
      'consumed',
      'food',
      'meal',
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'calories',
      'protein',
      'what should i eat',
      'nutrition',
      'healthy',
    ]

    const lowerMessage = message.toLowerCase()
    return foodKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  // Handle food-related questions
  async answerFoodQuestion(message, userContext = null, conversationContext = '') {
    const prompt = `
You are a helpful nutrition assistant for a food tracking bot. Answer the user's food/nutrition question in a helpful, concise way.

${conversationContext ? `Recent conversation context:\n${conversationContext}\n` : ''}

Current question: "${message}"

${userContext ? `User's current status:\n${JSON.stringify(userContext, null, 2)}` : ''}

Guidelines:
- Keep responses conversational and encouraging
- Use the user's current intake and goals to provide personalized advice
- If asking about what to eat more of, look at their remaining targets
- Suggest specific foods when possible
- Keep responses under 200 words
- End with a suggestion to log their food when they eat
- Use emojis appropriately for a friendly tone

Example responses:
- "Based on your goals, you need 50g more protein today. Try some Greek yogurt, chicken, or beans! 🍗"
- "You're doing great on calories! For the remaining 800 cal, maybe add some healthy fats like avocado or nuts 🥑"
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 300,
      })

      return (
        completion.choices[0]?.message?.content ||
        "I'd be happy to help with your nutrition question! Could you be more specific about what you'd like to know?"
      )
    } catch (error) {
      console.error('Food question answering error:', error)
      return "I'd be happy to help with your nutrition question! You can also use /status to see your current intake and /goals to check your targets."
    }
  }

  async parseFoodMessage(message) {
    // Check cache first
    const cacheKey = message.toLowerCase().trim()
    if (this.foodCache.has(cacheKey)) {
      return this.foodCache.get(cacheKey)
    }

    const prompt = `
Extract food items from this message and return JSON only:

Message: "${message}"

Return format:
{
  "foods": [
    {
      "item": "food name",
      "quantity": "amount with unit",
      "estimatedCalories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Use standard nutrition estimates. If no quantity specified, assume 1 serving.
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Free and fast
        temperature: 0.1,
        max_tokens: 500,
      })

      const response = completion.choices[0]?.message?.content
      const foodData = JSON.parse(response)

      // Cache the result (limit cache size)
      if (this.foodCache.size > 1000) {
        const firstKey = this.foodCache.keys().next().value
        this.foodCache.delete(firstKey)
      }
      this.foodCache.set(cacheKey, foodData)

      return foodData
    } catch (error) {
      console.error('AI parsing error:', error)
      // Fallback to basic parsing
      return this.basicFoodParsing(message)
    }
  }

  // Fallback method for when AI fails
  basicFoodParsing(message) {
    return {
      foods: [
        {
          item: message,
          quantity: '1 serving',
          estimatedCalories: 200,
          protein: 10,
          carbs: 20,
          fat: 8,
        },
      ],
    }
  }

  // Cost tracking
  logUsage(tokensUsed) {
    const cost = (tokensUsed / 1000000) * 0.1 // Groq pricing
    console.log(`AI cost for this request: $${cost.toFixed(6)}`)
  }
}

module.exports = new AIService()
