/**
 * Food Service
 * Handles estimating calories and macros for food entries
 */

// Size modifiers and their multipliers
const sizeModifiers = {
  tiny: 0.5,
  mini: 0.6,
  small: 0.7,
  little: 0.7,
  medium: 1.0,
  regular: 1.0,
  normal: 1.0,
  average: 1.0,
  large: 1.5,
  big: 1.7,
  huge: 2.0,
  giant: 2.2,
  extra: 1.3, // for "extra large"
  'extra large': 1.8,
  'extra small': 0.6,
  jumbo: 2.0,
  super: 1.8,
}

// Unit conversion factors (to grams)
const unitConversions = {
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  cup: 240, // ml, varies by food but good default
  cups: 240,
  tbsp: 15, // ml
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5, // ml
  teaspoon: 5,
  teaspoons: 5,
  // Portion-based units (convert to typical weights)
  slice: 30, // bread slice ~30g
  slices: 30,
  piece: 50, // generic piece ~50g
  pieces: 50,
}

// Lean percentages to fat content mapping
const leanPercentages = {
  80: { fatPer100g: 20 }, // 80% lean = 20% fat
  85: { fatPer100g: 15 }, // 85% lean = 15% fat
  90: { fatPer100g: 10 }, // 90% lean = 10% fat
  92: { fatPer100g: 8 }, // 92% lean = 8% fat
  93: { fatPer100g: 7 }, // 93% lean = 7% fat
  95: { fatPer100g: 5 }, // 95% lean = 5% fat
  96: { fatPer100g: 4 }, // 96% lean = 4% fat
  97: { fatPer100g: 3 }, // 97% lean = 3% fat
}

// Nutrition per 100g for accurate calculations
const nutritionPer100g = {
  // Proteins (per 100g raw)
  'beef patty': { calories: 250, protein: 26, carbs: 0, fat: 17 },
  'ground beef': { calories: 250, protein: 26, carbs: 0, fat: 17 },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 17 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  salmon: { calories: 206, protein: 22, carbs: 0, fat: 13 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 }, // per 100g of eggs

  // Fruits (per 100g)
  banana: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  apple: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  orange: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },

  // Grains (per 100g)
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, // cooked
  pasta: { calories: 131, protein: 5, carbs: 25, fat: 1.1 }, // cooked
}

// Simple database of common foods for MVP
// In a real implementation, this would be in a database or external API
const commonFoods = {
  // Fruits
  apple: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  banana: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  orange: { calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  grape: { calories: 3, protein: 0.1, carbs: 0.8, fat: 0 }, // per grape

  // Beverages
  coffee: { calories: 2, protein: 0.3, carbs: 0, fat: 0 }, // per cup black coffee
  'coffee with milk': { calories: 45, protein: 2.4, carbs: 3.6, fat: 1.7 }, // coffee with 2oz milk
  tea: { calories: 2, protein: 0, carbs: 0.7, fat: 0 }, // per cup
  water: { calories: 0, protein: 0, carbs: 0, fat: 0 },

  // Proteins
  egg: { calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, // per 100g
  salmon: { calories: 206, protein: 22, carbs: 0, fat: 13 }, // per 100g
  beef: { calories: 250, protein: 26, carbs: 0, fat: 17 }, // per 100g

  // Dairy
  milk: { calories: 42, protein: 3.4, carbs: 5, fat: 1 }, // per 100ml
  yogurt: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 }, // per 100g
  cheese: { calories: 402, protein: 25, carbs: 1.3, fat: 33 }, // per 100g

  // Grains
  bread: { calories: 265, protein: 9, carbs: 49, fat: 3.2 }, // per 100g
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, // per 100g cooked
  pasta: { calories: 131, protein: 5, carbs: 25, fat: 1.1 }, // per 100g cooked

  // Vegetables
  carrot: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 }, // per 100g
  broccoli: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }, // per 100g
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 }, // per 100g

  // Popular/Common foods
  sushi: { calories: 250, protein: 10, carbs: 35, fat: 7 }, // per 6-8 piece roll
  'sushi roll': { calories: 250, protein: 10, carbs: 35, fat: 7 }, // per 6-8 piece roll
  pizza: { calories: 285, protein: 12, carbs: 36, fat: 10 }, // per slice
  'pizza slice': { calories: 285, protein: 12, carbs: 36, fat: 10 }, // per slice
  sandwich: { calories: 300, protein: 15, carbs: 30, fat: 12 }, // basic sandwich
  burger: { calories: 540, protein: 31, carbs: 40, fat: 25 }, // hamburger
  burrito: { calories: 450, protein: 20, carbs: 50, fat: 18 }, // typical burrito
  salad: { calories: 150, protein: 8, carbs: 15, fat: 8 }, // mixed green salad with dressing

  // Snacks
  chocolate: { calories: 546, protein: 7.6, carbs: 57, fat: 31 }, // per 100g
  chips: { calories: 536, protein: 7, carbs: 53, fat: 34 }, // per 100g
  cookie: { calories: 80, protein: 1, carbs: 10, fat: 4 }, // per cookie
}

/**
 * Extract size modifiers from food input string
 * @param {string} input - Food input string
 * @returns {object} Extracted modifier and cleaned food name
 */
const extractSizeModifier = (input) => {
  const lowerInput = input.toLowerCase()

  // Check for compound modifiers first (like "extra large")
  for (const [modifier, multiplier] of Object.entries(sizeModifiers)) {
    if (modifier.includes(' ')) {
      // For multi-word modifiers like "extra large"
      const regex = new RegExp(`\\b${modifier}\\b`, 'i')
      if (regex.test(lowerInput)) {
        const cleanedFood = input.replace(regex, '').trim()
        return {
          modifier: modifier,
          multiplier: multiplier,
          food: cleanedFood,
        }
      }
    }
  }

  // Then check for single word modifiers
  for (const [modifier, multiplier] of Object.entries(sizeModifiers)) {
    if (!modifier.includes(' ')) {
      const regex = new RegExp(`\\b${modifier}\\b`, 'i')
      if (regex.test(lowerInput)) {
        const cleanedFood = input.replace(regex, '').trim()
        return {
          modifier: modifier,
          multiplier: multiplier,
          food: cleanedFood,
        }
      }
    }
  }

  return {
    modifier: null,
    multiplier: 1.0,
    food: input.trim(),
  }
}

/**
 * Extract quantities from food input string
 * @param {string} input - Food input string
 * @returns {object} Extracted quantity and food name
 */
const extractQuantity = (input) => {
  const quantityMatch = input.match(/^(\d+(?:\.\d+)?)\s+(.+)$/)

  if (quantityMatch) {
    return {
      quantity: parseFloat(quantityMatch[1]),
      food: quantityMatch[2].trim(),
    }
  }

  return {
    quantity: 1,
    food: input.trim(),
  }
}

/**
 * Estimate calories and macros for a given food
 * @param {string} foodText - Food description from user
 * @returns {object} Calories and macros estimation
 */
const estimateCalories = (foodText) => {
  // First check for specific measurements and lean percentages
  const measurementInfo = extractMeasurement(foodText)
  const leanInfo = extractLeanPercentage(foodText)

  // Clean the food text by removing measurement and lean info for better matching
  let cleanedFoodText = foodText
  if (measurementInfo.found) {
    cleanedFoodText = cleanedFoodText.replace(measurementInfo.matchedText, '').trim()
  }
  if (leanInfo.found) {
    cleanedFoodText = cleanedFoodText.replace(leanInfo.matchedText, '').trim()
  }

  // Extract any size modifiers from the cleaned text
  const { modifier, multiplier, food: foodWithoutModifier } = extractSizeModifier(cleanedFoodText)

  // Extract quantity from the cleaned text
  const { quantity, food } = extractQuantity(foodWithoutModifier)

  // If we have specific weight measurements, use weight-based calculation
  if (measurementInfo.found) {
    const weightBasedNutrition = calculateNutritionByWeight(food, measurementInfo.grams, leanInfo)

    if (weightBasedNutrition) {
      // Apply size modifier to weight-based calculation if present
      const totalMultiplier = quantity * multiplier

      let displayFood = food
      if (leanInfo.found) {
        displayFood += ` ${leanInfo.percentage}% lean`
      }
      if (modifier) {
        displayFood = `${modifier} ${displayFood}`
      }

      return {
        food: `${displayFood} (${measurementInfo.amount}${measurementInfo.unit})`,
        quantity: quantity,
        modifier: modifier,
        sizeMultiplier: multiplier,
        weight: `${measurementInfo.amount}${measurementInfo.unit}`,
        leanPercentage: leanInfo.found ? leanInfo.percentage : null,
        calories: Math.round(weightBasedNutrition.calories * totalMultiplier),
        protein: Math.round(weightBasedNutrition.protein * totalMultiplier * 10) / 10,
        carbs: Math.round(weightBasedNutrition.carbs * totalMultiplier * 10) / 10,
        fat: Math.round(weightBasedNutrition.fat * totalMultiplier * 10) / 10,
        source: 'weight_calculated',
        accuracy: 'high',
      }
    }
  }

  // Fallback to original database matching for foods without specific weights
  const lowerCaseFood = food.toLowerCase()

  // Check against our database of common foods
  for (const [knownFood, nutrition] of Object.entries(commonFoods)) {
    if (lowerCaseFood.includes(knownFood)) {
      const totalMultiplier = quantity * multiplier

      let displayFood = food
      if (modifier) {
        displayFood = `${modifier} ${food}`
      }

      return {
        food: displayFood,
        quantity: quantity,
        modifier: modifier,
        sizeMultiplier: multiplier,
        calories: Math.round(nutrition.calories * totalMultiplier),
        protein: Math.round(nutrition.protein * totalMultiplier * 10) / 10,
        carbs: Math.round(nutrition.carbs * totalMultiplier * 10) / 10,
        fat: Math.round(nutrition.fat * totalMultiplier * 10) / 10,
        source: 'database',
        accuracy: 'medium',
      }
    }
  }

  // Basic estimation for unknown foods (also apply modifier)
  const totalMultiplier = quantity * multiplier
  let displayFood = food
  if (modifier) {
    displayFood = `${modifier} ${food}`
  }

  return {
    food: displayFood,
    quantity: quantity,
    modifier: modifier,
    sizeMultiplier: multiplier,
    calories: Math.round(100 * totalMultiplier), // Default estimation
    protein: Math.round(5 * totalMultiplier * 10) / 10,
    carbs: Math.round(15 * totalMultiplier * 10) / 10,
    fat: Math.round(2 * totalMultiplier * 10) / 10,
    source: 'estimated',
    accuracy: 'low',
    note: 'Estimated values. For more accurate tracking, try being more specific with food names.',
  }
}

/**
 * Extract specific weight/measurement from food input
 * @param {string} input - Food input string
 * @returns {object} Extracted weight info
 */
const extractMeasurement = (input) => {
  // Look for patterns like "5oz", "100g", "2 cups", "1.5 lbs", "1 slice"
  const measurementPatterns = [
    /(\d+(?:\.\d+)?)\s*(oz|ounces?|g|grams?|lbs?|pounds?|kg|kilograms?|cups?|tbsp|tablespoons?|tsp|teaspoons?|slices?|pieces?)\b/gi,
    /(\d+(?:\.\d+)?)(oz|g|lbs?|kg)\b/gi, // No space versions like "5oz", "100g"
  ]

  for (const pattern of measurementPatterns) {
    const match = input.match(pattern)
    if (match) {
      const fullMatch = match[0]
      const [, amount, unit] =
        fullMatch.match(
          /(\d+(?:\.\d+)?)\s*(oz|ounces?|g|grams?|lbs?|pounds?|kg|kilograms?|cups?|tbsp|tablespoons?|tsp|teaspoons?|slices?|pieces?)/i
        ) || []

      if (amount && unit) {
        const normalizedUnit = unit.toLowerCase().replace(/s$/, '') // Remove plural 's'
        const conversionFactor =
          unitConversions[normalizedUnit] || unitConversions[unit.toLowerCase()]

        if (conversionFactor) {
          return {
            amount: parseFloat(amount),
            unit: unit,
            grams: parseFloat(amount) * conversionFactor,
            found: true,
            matchedText: fullMatch,
          }
        }
      }
    }
  }

  return { found: false }
}

/**
 * Extract lean percentage from food input
 * @param {string} input - Food input string
 * @returns {object} Extracted lean percentage info
 */
const extractLeanPercentage = (input) => {
  // Look for patterns like "92% lean", "85%lean", "90 percent lean"
  const leanPatterns = [
    /(\d+)%\s*lean/gi,
    /(\d+)\s*percent\s*lean/gi,
    /(\d+)%lean/gi, // No space
  ]

  for (const pattern of leanPatterns) {
    const match = input.match(pattern)
    if (match) {
      const percentage = parseInt(match[1])
      if (leanPercentages[percentage]) {
        return {
          percentage: percentage,
          fatPer100g: leanPercentages[percentage].fatPer100g,
          found: true,
          matchedText: match[0],
        }
      }
    }
  }

  return { found: false }
}

/**
 * Calculate nutrition based on weight and lean percentage
 * @param {string} foodName - Name of the food
 * @param {number} weightInGrams - Weight in grams
 * @param {object} leanInfo - Lean percentage information
 * @returns {object} Calculated nutrition
 */
const calculateNutritionByWeight = (foodName, weightInGrams, leanInfo = null) => {
  // Find the food in our nutrition database
  let baseNutrition = null
  const lowerFoodName = foodName.toLowerCase()

  for (const [key, nutrition] of Object.entries(nutritionPer100g)) {
    if (lowerFoodName.includes(key)) {
      baseNutrition = nutrition
      break
    }
  }

  if (!baseNutrition) {
    // Return null if we don't have accurate nutrition data
    return null
  }

  // Calculate nutrition for the specific weight
  const multiplier = weightInGrams / 100 // Convert to per-100g multiplier
  let calories = baseNutrition.calories * multiplier
  let protein = baseNutrition.protein * multiplier
  let carbs = baseNutrition.carbs * multiplier
  let fat = baseNutrition.fat * multiplier

  // Adjust for lean percentage if provided (mainly for meat)
  if (leanInfo && leanInfo.found) {
    const adjustedFat = (leanInfo.fatPer100g / 100) * weightInGrams
    fat = adjustedFat

    // Recalculate calories: protein = 4 cal/g, carbs = 4 cal/g, fat = 9 cal/g
    calories = protein * 4 + carbs * 4 + fat * 9
  }

  return {
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    weightInGrams: weightInGrams,
    isCalculated: true,
  }
}

module.exports = {
  estimateCalories,
  extractQuantity,
  extractSizeModifier,
  sizeModifiers,
  extractMeasurement,
  extractLeanPercentage,
  calculateNutritionByWeight,
}
