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
  // First extract any size modifiers
  const { modifier, multiplier, food: foodWithoutModifier } = extractSizeModifier(foodText)

  // Then extract quantity
  const { quantity, food } = extractQuantity(foodWithoutModifier)
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
    note: 'Estimated values. For more accurate tracking, try being more specific with food names.',
  }
}

module.exports = {
  estimateCalories,
  extractQuantity,
  extractSizeModifier,
  sizeModifiers,
}
