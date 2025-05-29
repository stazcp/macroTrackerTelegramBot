const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: String,
  firstName: String,
  lastName: String,
  calorieGoal: {
    type: Number,
    default: 2000,
  },
  proteinGoal: {
    type: Number,
    default: 150,
  },
  carbsGoal: {
    type: Number,
    default: 200,
  },
  fatGoal: {
    type: Number,
    default: 65,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('User', userSchema)
