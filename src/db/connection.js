const mongoose = require('mongoose')

/**
 * Connect to MongoDB database
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/macro-tracker'

  // With Mongoose 6+, useNewUrlParser and useUnifiedTopology are deprecated and enabled by default
  return mongoose.connect(connectionString)
}

module.exports = connectDB
