/**
 * Food Service
 * Handles estimating calories and macros for food entries
 */

// Simple database of common foods for MVP
// In a real implementation, this would be in a database or external API
const commonFoods = {
  // Fruits
  apple: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  banana: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  orange: { calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  grape: { calories: 3, protein: 0.1, carbs: 0.8, fat: 0 }, // per grape

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

  // Snacks
  chocolate: { calories: 546, protein: 7.6, carbs: 57, fat: 31 }, // per 100g
  chips: { calories: 536, protein: 7, carbs: 53, fat: 34 }, // per 100g
  cookie: { calories: 80, protein: 1, carbs: 10, fat: 4 }, // per cookie
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
  const { quantity, food } = extractQuantity(foodText)
  const lowerCaseFood = food.toLowerCase()

  // Check against our database of common foods
  for (const [knownFood, nutrition] of Object.entries(commonFoods)) {
    if (lowerCaseFood.includes(knownFood)) {
      return {
        food: food,
        quantity: quantity,
        calories: Math.round(nutrition.calories * quantity),
        protein: Math.round(nutrition.protein * quantity * 10) / 10,
        carbs: Math.round(nutrition.carbs * quantity * 10) / 10,
        fat: Math.round(nutrition.fat * quantity * 10) / 10,
        source: 'database',
      }
    }
  }

  // Basic estimation for unknown foods
  // In a real implementation, this would call a nutrition API
  return {
    food: food,
    quantity: quantity,
    calories: Math.round(100 * quantity), // Default estimation
    protein: Math.round(5 * quantity * 10) / 10,
    carbs: Math.round(15 * quantity * 10) / 10,
    fat: Math.round(2 * quantity * 10) / 10,
    source: 'estimated',
    note: 'Estimated values. For more accurate tracking, try being more specific with food names.',
  }
}

module.exports = {
  estimateCalories,
  extractQuantity,
}
