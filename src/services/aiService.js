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
Extract all individual food items from this message and return JSON only. Parse compound foods into separate items with realistic nutrition data.

Message: "${message}"

CRITICAL: Return ONLY valid JSON. Do NOT include markdown formatting, code blocks, or any text outside the JSON object.

Guidelines:
- Parse "beef patty with 2 eggs" as separate: beef patty (1) + eggs (2)
- Parse "chicken sandwich" as: bread (2 slices) + chicken breast (100g) + any mentioned additions
- Parse "pasta with sauce" as: pasta + sauce separately
- PAY SPECIAL ATTENTION TO SPECIFIC MEASUREMENTS: 5oz, 100g, 2 cups, 1.5 lbs, etc.
- PRESERVE LEAN PERCENTAGES: 92% lean, 85% lean, 90% lean beef
- Apply size multipliers: tiny/mini (0.5-0.6x), small/little (0.7x), medium/regular/normal (1.0x), large (1.5x), big (1.7x), huge/giant/jumbo (2.0-2.2x), extra large (1.8x), extra small (0.6x)
- Use weight-based calculations when specific measurements are provided
- For specific weights, calculate nutrition accurately:
  * 5oz (142g) 92% lean beef patty = ~280 calories, 37g protein, 0g carbs, 11g fat
  * 100g chicken breast = ~165 calories, 31g protein, 0g carbs, 3.6g fat
  * 2 large eggs = ~140 calories, 12g protein, 1g carbs, 10g fat
- If quantity not specified, use reasonable defaults (1 patty, 1 cup pasta, 6-8 pieces sushi, etc.)
- PRESERVE size descriptors AND measurements in the item name (e.g., "big banana", "5oz beef patty 92% lean")

MEASUREMENT PRIORITY:
1. Specific weights (5oz, 100g) = HIGHEST accuracy
2. Size modifiers (big, small) = MEDIUM accuracy  
3. Generic quantities = LOWEST accuracy

ASK FOLLOW-UP QUESTIONS when food is too vague:
- "sushi" → "What type of sushi? (e.g., California roll, salmon roll, nigiri)"
- "pizza" → "What size pizza slice? (small, medium, large) And what toppings?"
- "salad" → "What type of salad? (Caesar, garden, with dressing?)"
- "pasta" → "What type of pasta and sauce? How much?"
- "sandwich" → "What kind of sandwich? (turkey, ham, PB&J, etc.)"

Examples:
- "5oz 92% lean beef patty" = 280 calories, 37g protein, 0g carbs, 11g fat
- "2 large eggs" = 140 calories, 12g protein, 1g carbs, 10g fat
- "1 slice bread" = 80 calories, 3g protein, 15g carbs, 1g fat
- "big banana" = banana × 1.7 multiplier = ~150 calories, 1.9g protein, 39g carbs, 0.5g fat

RETURN FORMAT (VALID JSON ONLY):
{
  "foods": [
    {
      "item": "specific food name with measurements and modifiers",
      "quantity": "amount with unit",
      "estimatedCalories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "source": "ai_enhanced",
      "accuracy": "high|medium|low",
      "needsClarification": false
    }
  ],
  "total_calories": number,
  "parsing_notes": "brief explanation of how items were parsed",
  "needsFollowUp": false,
  "followUpQuestion": ""
}

If food is too ambiguous, set needsFollowUp to true and provide a helpful followUpQuestion.
`

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant', // Free and fast
        temperature: 0.1,
        max_tokens: 800, // Increased for multiple food items
      })

      const response = completion.choices[0]?.message?.content
      console.log('AI response for food parsing:', response) // Debug logging

      if (!response) {
        console.warn('Empty AI response, using enhanced fallback')
        return this.enhancedFoodParsing(message)
      }

      // Clean up the response - remove markdown formatting if present
      let cleanedResponse = response.trim()

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      // Remove any extra text after the JSON object
      const jsonStart = cleanedResponse.indexOf('{')
      const jsonEnd = cleanedResponse.lastIndexOf('}')

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1)
      }

      let foodData
      try {
        foodData = JSON.parse(cleanedResponse)
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError.message)
        console.error('Cleaned response:', cleanedResponse)
        console.warn('Using enhanced fallback due to JSON parsing error')
        return this.enhancedFoodParsing(message)
      }

      // Validate the response structure
      if (!foodData.foods || !Array.isArray(foodData.foods) || foodData.foods.length === 0) {
        console.warn('Invalid AI response structure, using enhanced fallback')
        return this.enhancedFoodParsing(message)
      }

      // Calculate total calories if not provided
      if (!foodData.total_calories) {
        foodData.total_calories = foodData.foods.reduce(
          (sum, food) => sum + food.estimatedCalories,
          0
        )
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
      // Fallback to enhanced parsing
      return this.enhancedFoodParsing(message)
    }
  }

  // Enhanced fallback method that can handle compound foods better
  enhancedFoodParsing(message) {
    const lowerMessage = message.toLowerCase()
    const foods = []
    const matchedRanges = [] // Track which parts of the message have been matched

    // Import the foodService to use its enhanced modifier functionality
    const foodService = require('./foodService')

    // Enhanced food database with more variations and realistic portions
    const enhancedFoodDb = {
      // Proteins (order by specificity - longer matches first)
      'beef patty': { calories: 350, protein: 28, carbs: 1, fat: 22, defaultQty: 1, unit: 'patty' },
      'burger patty': {
        calories: 350,
        protein: 28,
        carbs: 1,
        fat: 22,
        defaultQty: 1,
        unit: 'patty',
      },
      'hamburger patty': {
        calories: 350,
        protein: 28,
        carbs: 1,
        fat: 22,
        defaultQty: 1,
        unit: 'patty',
      },
      'chicken breast': {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        defaultQty: 100,
        unit: 'g',
      },
      eggs: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5, defaultQty: 2, unit: 'eggs' },
      egg: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5, defaultQty: 1, unit: 'egg' },
      beef: { calories: 250, protein: 26, carbs: 0, fat: 17, defaultQty: 100, unit: 'g' },
      salmon: { calories: 206, protein: 22, carbs: 0, fat: 13, defaultQty: 100, unit: 'g' },
      banana: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, defaultQty: 1, unit: 'banana' },
      apple: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, defaultQty: 1, unit: 'apple' },

      // Carbs
      bread: { calories: 80, protein: 3, carbs: 15, fat: 1, defaultQty: 1, unit: 'slice' },
      toast: { calories: 80, protein: 3, carbs: 15, fat: 1, defaultQty: 1, unit: 'slice' },
      rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, defaultQty: 1, unit: 'cup' },
      pasta: { calories: 220, protein: 8, carbs: 44, fat: 1.3, defaultQty: 1, unit: 'cup' },
      potato: { calories: 161, protein: 4.3, carbs: 37, fat: 0.2, defaultQty: 1, unit: 'medium' },

      // Dairy
      cheese: { calories: 113, protein: 7, carbs: 1, fat: 9, defaultQty: 1, unit: 'slice' },
      milk: { calories: 83, protein: 8, carbs: 12, fat: 2.4, defaultQty: 1, unit: 'cup' },
      yogurt: { calories: 150, protein: 8, carbs: 17, fat: 4, defaultQty: 1, unit: 'cup' },

      // Common combinations
      sandwich: { calories: 300, protein: 15, carbs: 30, fat: 12, defaultQty: 1, unit: 'sandwich' },
      burger: { calories: 540, protein: 31, carbs: 40, fat: 25, defaultQty: 1, unit: 'burger' },
    }

    // Function to check if a range overlaps with already matched ranges
    const isOverlapping = (start, end) => {
      return matchedRanges.some(
        (range) =>
          (start >= range.start && start <= range.end) ||
          (end >= range.start && end <= range.end) ||
          (start <= range.start && end >= range.end)
      )
    }

    // Function to extract quantity and position, now with size modifier support
    const extractQuantityAndPosition = (text, foodKey) => {
      // First try to find patterns with size modifiers
      const sizeModifiers = Object.keys(foodService.sizeModifiers)

      // Look for size modifiers before the food item
      for (const modifier of sizeModifiers) {
        const patterns = [
          new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s+${modifier}\\s+${foodKey}\\b`, 'i'),
          new RegExp(`\\b${modifier}\\s+${foodKey}\\s+\\((\\d+(?:\\.\\d+)?)\\)`, 'i'),
          new RegExp(`\\b${modifier}\\s+${foodKey}\\b`, 'i'),
        ]

        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) {
            const quantity = match[1] ? parseFloat(match[1]) : enhancedFoodDb[foodKey].defaultQty
            return {
              quantity: quantity,
              modifier: modifier,
              start: match.index,
              end: match.index + match[0].length,
            }
          }
        }
      }

      // Fallback to original patterns without modifiers
      const patterns = [
        new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s+${foodKey}\\b`, 'i'),
        new RegExp(`\\b${foodKey}\\s+\\((\\d+(?:\\.\\d+)?)\\)`, 'i'),
        new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*${foodKey}\\b`, 'i'),
      ]

      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          return {
            quantity: parseFloat(match[1]),
            modifier: null,
            start: match.index,
            end: match.index + match[0].length,
          }
        }
      }

      // If no quantity found, look for just the food item with word boundaries
      const foodPattern = new RegExp(`\\b${foodKey}\\b`, 'i')
      const foodMatch = text.match(foodPattern)
      if (foodMatch) {
        return {
          quantity: enhancedFoodDb[foodKey].defaultQty,
          modifier: null,
          start: foodMatch.index,
          end: foodMatch.index + foodMatch[0].length,
        }
      }

      return null
    }

    // Sort food keys by length (longest first) to prioritize specific matches
    const sortedFoodKeys = Object.keys(enhancedFoodDb).sort((a, b) => b.length - a.length)

    // Try to find foods in the message, avoiding overlaps
    for (const foodKey of sortedFoodKeys) {
      const result = extractQuantityAndPosition(lowerMessage, foodKey)

      if (result && !isOverlapping(result.start, result.end)) {
        const nutrition = enhancedFoodDb[foodKey]
        const baseMultiplier = result.quantity / nutrition.defaultQty

        // Apply size modifier if present
        let sizeMultiplier = 1.0
        let displayName = foodKey

        if (result.modifier) {
          sizeMultiplier = foodService.sizeModifiers[result.modifier] || 1.0
          displayName = `${result.modifier} ${foodKey}`
        }

        const totalMultiplier = baseMultiplier * sizeMultiplier

        foods.push({
          item: displayName,
          quantity: `${result.quantity} ${nutrition.unit}${result.quantity > 1 ? 's' : ''}`,
          estimatedCalories: Math.round(nutrition.calories * totalMultiplier),
          protein: Math.round(nutrition.protein * totalMultiplier * 10) / 10,
          carbs: Math.round(nutrition.carbs * totalMultiplier * 10) / 10,
          fat: Math.round(nutrition.fat * totalMultiplier * 10) / 10,
          source: 'enhanced_fallback',
        })

        // Mark this range as matched
        matchedRanges.push({ start: result.start, end: result.end })
      }
    }

    // If no foods found using enhanced database, use the foodService directly
    // This will capture foods not in our enhanced database but with size modifiers
    if (foods.length === 0) {
      try {
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
              source: 'foodservice_fallback',
            },
          ],
          total_calories: nutritionInfo.calories,
          parsing_notes: `Used foodService with size modifier support`,
        }
      } catch (error) {
        console.error('FoodService fallback error:', error)
        return this.basicFoodParsing(message)
      }
    }

    const totalCalories = foods.reduce((sum, food) => sum + food.estimatedCalories, 0)

    return {
      foods,
      total_calories: totalCalories,
      parsing_notes: `Found ${foods.length} food item(s) using enhanced parsing with size modifier support`,
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
