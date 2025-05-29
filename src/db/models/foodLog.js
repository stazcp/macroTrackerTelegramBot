const mongoose = require('mongoose')

const foodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  telegramId: {
    type: Number,
    required: true,
  },
  food: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    default: 'serving',
  },
  calories: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    default: 0,
  },
  carbs: {
    type: Number,
    default: 0,
  },
  fat: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: String,
})

// Index for efficient querying by date and user
foodLogSchema.index({ telegramId: 1, date: 1 })

module.exports = mongoose.model('FoodLog', foodLogSchema)
