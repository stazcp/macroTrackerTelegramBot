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
- "modify_food": User is clarifying or adding to a recently logged food item (e.g., "with milk", "and some sugar", "it was actually 2 cups")
- "food_question": User is asking about food, nutrition, or what to eat (e.g., "what should I eat?", "what do I need more of?", "is this healthy?")
- "other": Not food-related

Pay special attention to:
- Short phrases that could be modifications: "with milk", "and cheese", "extra large", "actually 2"
- Context from previous messages about food logging
- References to previous items using "it", "that", "my [food]"

Return format:
{
  "intent": "log_food" | "modify_food" | "food_question" | "other",
  "confidence": 0.0-1.0,
  "modification_type": "addition" | "correction" | "clarification" | null
}
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 200,
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

    // Modification indicators
    const modificationWords = ['with', 'and', 'plus', 'add', 'also', 'actually', 'it was', 'my']
    const modificationPhrases = [
      'with milk',
      'and cheese',
      'extra',
      'large',
      'small',
      'and one',
      'and a',
      'plus one',
    ]

    // Question indicators
    const questionWords = ['what', 'how', 'should', 'need', 'can', 'which', '?']
    const adviceWords = ['recommend', 'suggest', 'advice', 'help', 'should eat']

    // Food consumption indicators
    const consumptionWords = ['ate', 'had', 'consumed', 'finished', 'just', 'eating']

    const hasModificationWords = modificationWords.some((word) => lowerMessage.includes(word))
    const hasModificationPhrases = modificationPhrases.some((phrase) =>
      lowerMessage.includes(phrase)
    )
    const hasQuestionWords = questionWords.some((word) => lowerMessage.includes(word))
    const hasAdviceWords = adviceWords.some((word) => lowerMessage.includes(word))
    const hasConsumptionWords = consumptionWords.some((word) => lowerMessage.includes(word))

    // Check for modifications first (phrases that start with modification words or are short additions)
    if (
      lowerMessage.startsWith('and ') ||
      lowerMessage.startsWith('with ') ||
      lowerMessage.startsWith('plus ')
    ) {
      return {
        intent: 'modify_food',
        confidence: 0.9,
        modification_type: 'addition',
      }
    } else if ((hasModificationWords || hasModificationPhrases) && lowerMessage.length < 50) {
      return {
        intent: 'modify_food',
        confidence: 0.8,
        modification_type: 'addition',
      }
    } else if (hasQuestionWords || hasAdviceWords) {
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

Important:
- Use realistic nutrition estimates for common foods
- If the food is "apple", use approximately: 95 calories, 0.5g protein, 25g carbs, 0.3g fat
- If the food is "coffee", use approximately: 2 calories, 0g protein, 0g carbs, 0g fat
- If no quantity specified, assume 1 serving
- Return valid JSON only, no other text
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Free and fast
        temperature: 0.1,
        max_tokens: 500,
      })

      const response = completion.choices[0]?.message?.content
      console.log('AI response for food parsing:', response) // Debug logging

      if (!response) {
        console.warn('Empty AI response, using fallback')
        return this.basicFoodParsing(message)
      }

      const foodData = JSON.parse(response)

      // Validate the response structure
      if (!foodData.foods || !Array.isArray(foodData.foods) || foodData.foods.length === 0) {
        console.warn('Invalid AI response structure, using fallback')
        return this.basicFoodParsing(message)
      }

      // Cache the result (limit cache size)
      if (this.foodCache.size > 1000) {
        const firstKey = this.foodCache.keys().next().value
        this.foodCache.delete(firstKey)
      }
      this.foodCache.set(cacheKey, foodData)

      return foodData
    } catch (error) {
      console.error('AI parsing error:', error.message)
      // Fallback to basic parsing
      return this.basicFoodParsing(message)
    }
  }

  // Fallback method for when AI fails
  basicFoodParsing(message) {
    // Use the food service to get actual nutritional data instead of hardcoded fallback
    const foodService = require('./foodService')

    try {
      // Try to extract meaningful nutritional data using the food service
      const nutritionInfo = foodService.estimateCalories(message)

      return {
        foods: [
          {
            item: nutritionInfo.food,
            quantity: `${nutritionInfo.quantity} serving${nutritionInfo.quantity > 1 ? 's' : ''}`,
            estimatedCalories: nutritionInfo.calories,
            protein: nutritionInfo.protein,
            carbs: nutritionInfo.carbs,
            fat: nutritionInfo.fat,
          },
        ],
      }
    } catch (error) {
      console.error('Fallback food parsing error:', error)

      // Last resort fallback with very conservative estimates
      return {
        foods: [
          {
            item: message.toLowerCase().trim(),
            quantity: '1 serving',
            estimatedCalories: 100, // More realistic default
            protein: 2,
            carbs: 15,
            fat: 3,
          },
        ],
      }
    }
  }

  // Cost tracking
  logUsage(tokensUsed) {
    const cost = (tokensUsed / 1000000) * 0.1 // Groq pricing
    console.log(`AI cost for this request: $${cost.toFixed(6)}`)
  }

  // Handle food modifications and clarifications
  async handleFoodModification(message, recentFoodContext, conversationContext = '') {
    const prompt = `
You are helping to modify or clarify a recently logged food item. The user is adding information to a previous entry.

${conversationContext ? `Recent conversation context:\n${conversationContext}\n` : ''}

Recent food entry: ${JSON.stringify(recentFoodContext)}
User modification: "${message}"

Create a combined/updated food entry with the modification. Return JSON only:

{
  "action": "update" | "add_separate",
  "combined_food": {
    "item": "updated food name including modification",
    "quantity": "combined quantity",
    "estimatedCalories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "explanation": "brief note about what was modified"
  }
}

Examples:
- Recent: "coffee", Modification: "with milk" → "coffee with milk" (update)
- Recent: "sandwich", Modification: "and chips" → add separate "chips" (add_separate)
- Recent: "apple", Modification: "it was actually 2" → "apple" with quantity 2 (update)
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 300,
      })

      const response = completion.choices[0]?.message?.content
      return JSON.parse(response)
    } catch (error) {
      console.error('Food modification error:', error)
      // Fallback: treat as separate food item
      return {
        action: 'add_separate',
        combined_food: {
          item: message,
          quantity: '1 serving',
          estimatedCalories: 50,
          protein: 1,
          carbs: 5,
          fat: 1,
          explanation: 'Added as separate item due to processing error',
        },
      }
    }
  }
}

module.exports = new AIService()
