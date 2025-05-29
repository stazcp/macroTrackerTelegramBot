# Macro Tracker Telegram Bot

A Telegram bot for tracking daily calorie intake and macronutrients (protein, carbs, fat) with **AI-powered conversational food logging**.

## Overview

This bot allows users to easily log their food intake through natural language messages on Telegram. It uses AI to parse conversational messages and provides accurate calorie and macronutrient estimates, helping users track their daily nutritional goals.

## 🚀 Key Features

### **Conversational AI Food Logging**

Talk to the bot naturally! No need for rigid commands:

- ✅ "Hi Tommy, just ate a beef patty around 5oz, 3 small potatoes and a splash of EVOO"
- ✅ "Had 2 eggs and toast for breakfast"
- ✅ "Lunch: chicken salad with avocado"

### **Smart & Cost-Effective**

- **AI-Powered**: Uses Groq's fast, free LLM API for natural language processing
- **Intelligent Detection**: Only uses AI for food-related messages
- **Caching System**: Saves costs by caching common food items
- **Graceful Fallback**: Works even when AI is unavailable

### **Traditional Features**

- **Simple Food Logging**: Traditional `/log` commands still work
- **Daily Stats**: View summary of calories and macros consumed today
- **Personalized Goals**: Set and track personalized calorie and macro targets
- **History Tracking**: Review past food logs and nutritional intake

## 💰 Cost Strategy

Our AI strategy is designed to **start free and scale affordably**:

| Users   | Daily Food Logs  | Monthly Cost   | Status             |
| ------- | ---------------- | -------------- | ------------------ |
| 0-100   | Up to 14,400/day | **FREE**       | Groq free tier     |
| 1,000+  | High volume      | ~$5-10/month   | Very affordable    |
| 10,000+ | Enterprise scale | ~$50-100/month | You're profitable! |

**Cost-Saving Features:**

- Smart keyword detection (only uses AI for food messages)
- Response caching for identical queries
- Efficient prompting (minimal token usage)
- Automatic fallback to basic parsing

### Commands

- `/start` - Initialize the bot and create user profile
- `/help` - Display available commands and usage instructions
- `/log [food item]` - Log a food item (e.g., `/log 1 apple`)
- `/status` - Check today's calorie and macro consumption vs. goals
- `/goals [calories] [protein] [carbs] [fat]` - Set or view nutritional goals
- `/history` - View food log history

## Technical Architecture

### Project Structure

```
telegram-calorie-tracker-bot/
├── README.md            # Project documentation
├── package.json         # Dependencies and scripts
├── .env                 # Environment variables (not in version control)
└── src/
    ├── index.js         # Entry point
    ├── bot.js           # Bot configuration with AI integration
    ├── commands/        # Command handlers
    │   ├── startCommand.js
    │   ├── helpCommand.js
    │   ├── logCommand.js
    │   ├── statusCommand.js
    │   ├── goalsCommand.js
    │   └── historyCommand.js
    ├── services/        # Business logic
    │   ├── aiService.js     # 🆕 AI-powered food parsing
    │   ├── foodService.js
    │   ├── userService.js
    │   └── logService.js
    └── db/              # Database related files
        ├── models/      # MongoDB schemas
        │   ├── user.js
        │   └── foodLog.js
        └── connection.js
```

### Core Dependencies

- `node-telegram-bot-api`: For Telegram bot functionality
- `mongoose`: For MongoDB database connection
- `groq-sdk`: For AI-powered natural language processing
- `dotenv`: For environment variables

### AI Architecture

```
User Message → Keyword Detection → AI Processing → Structured Data → Database
     ↓              ↓                    ↓              ↓              ↓
"Had 2 eggs"   → Is about food?    → Groq LLM     → {item, cals}  → MongoDB
     ↓              ↓                    ↓              ↓              ↓
"Hi there"     → Not food-related  → Skip AI      → Helpful msg   → No DB
```

## Setup and Installation

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather and send `/newbot`
3. Follow the prompts to name your bot and create a username
4. BotFather will provide a token - save this for the next step
5. (Optional) Set bot commands with BotFather using `/setcommands`:
   ```
   start - Initialize the bot
   help - Show available commands
   log - Log a food item (e.g., /log apple)
   status - View today's nutritional summary
   goals - View or set nutritional goals
   history - View food log history
   ```

### 2. Setup AI Service (Groq)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key for the next step

### 3. Setup MongoDB

1. **Local development**: Install MongoDB locally or use Docker
2. **Production**: Create a MongoDB Atlas account and set up a cluster
   - Create a database user with read/write permissions
   - Whitelist your IP address in the Network Access settings
   - Get your connection string from the "Connect" button

### 4. Configure Environment Variables

Create a `.env` file in the project root with:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

### 5. Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start the bot
npm start

# For development with auto-reload
npm run dev
```

## 🎯 Usage Examples

### Conversational Food Logging

```
User: "Just had a beef patty around 5oz, 3 small potatoes and a splash of EVOO"

Bot: Got it! I logged:

🍽️ beef patty (5oz)
   📊 350 cal | 28g protein | 0g carbs | 25g fat

🍽️ small potatoes (3 pieces)
   📊 180 cal | 4g protein | 42g carbs | 0g fat

🍽️ extra virgin olive oil (1 tablespoon)
   📊 120 cal | 0g protein | 0g carbs | 14g fat

Total: 650 calories added to today's log! 📈
```

### Traditional Commands Still Work

```
User: /log 1 apple
Bot: Logged 1 apple (95 calories, 0g protein, 25g carbs, 0g fat)

User: /status
Bot: Today's intake: 745/2000 calories (37%)...
```

## 📱 How to Use the Bot

### 1. Start the Bot

```
User: /start
Bot: Welcome to Macro Tracker! 🍎📊

I'm here to help you track your nutrition goals. You can:
• Talk to me naturally about what you eat
• Use traditional commands like /log
• Set goals with /goals and check progress with /status

Let's get started! What did you eat today?
```

### 2. Set Your Daily Goals (Optional)

```
User: /goals 2000 150 200 65
Bot: Goals updated! 🎯
📊 Daily targets:
• Calories: 2000
• Protein: 150g
• Carbs: 200g
• Fat: 65g

Use /status anytime to check your progress!
```

### 3. Log Food Naturally

**Option A: Conversational (AI-powered)**

```
User: "Just had a chicken breast with rice"
Bot: Got it! I logged:

🍽️ chicken breast (1 serving)
   📊 165 cal | 31g protein | 0g carbs | 3.6g fat

Total: 165 calories added to today's log! 📈
```

**Option B: Traditional Commands**

```
User: /log chicken breast 6oz
Bot: Logged chicken breast 6oz (280 calories, 52g protein, 0g carbs, 6g fat)
```

### 4. Check Your Progress

```
User: /status
Bot: 📊 Today's Progress (January 15, 2025)

🔥 Calories: 600/2000 (30%)
🥩 Protein: 74/150g (49%)
🍞 Carbs: 42/200g (21%)
🥑 Fat: 30/65g (46%)

You're doing great! Keep it up! 💪
```

### 5. View Your History

```
User: /history
Bot: 📅 Recent Food Log

Today (Jan 15):
• scrambled eggs with cheese - 320 cal
• chicken breast 6oz - 280 cal
Total: 600 calories

Yesterday (Jan 14):
• oatmeal with banana - 280 cal
• turkey sandwich - 450 cal
• salmon with rice - 520 cal
Total: 1,250 calories
```

### 6. More Natural Conversations

The bot understands various ways to express food intake:

```
✅ "Just finished lunch - grilled chicken salad with avocado"
✅ "Snacked on 2 apples and some nuts"
✅ "Dinner: pasta with marinara sauce, about 2 cups"
✅ "Had a protein shake after workout"
✅ "Ate 3 slices of pizza 🍕"
```

**Non-food messages get helpful responses:**

```
User: "How's the weather?"
Bot: Hey! I'm here to help track your food. Try telling me what you ate like:

"Just had a chicken breast with rice"
"Ate 2 slices of pizza for lunch"

Or use /help to see all commands! 😊
```

### 7. Get Help Anytime

```
User: /help
Bot: 🤖 Macro Tracker Commands

📝 Food Logging:
• Just tell me what you ate naturally!
• /log [food] - Traditional logging

📊 Tracking:
• /status - Today's progress
• /goals [calories] [protein] [carbs] [fat] - Set targets
• /history - View past logs

💡 Tips:
• Be specific with portions for better accuracy
• I understand natural language - just chat normally!
• Use /start to reset or get started

Need help? Just ask! 😊
```

## 🚀 Deployment Strategy

For production deployment, consider these platforms:

1. **Railway** - Free tier, easy GitHub integration
2. **Google Cloud Run** - Pay-per-use, scales automatically
3. **Heroku** - Simple deployment (paid plans only)
4. **DigitalOcean App Platform** - Affordable with predictable pricing

Don't forget to:

- Switch to MongoDB Atlas for cloud database
- Set production environment variables
- Monitor AI usage and costs

## Development Roadmap

### Phase 1: AI-Powered MVP ✅

- Conversational food logging with Groq
- Smart keyword detection
- Cost-optimized architecture
- Graceful fallbacks

### Phase 2: Enhanced Intelligence

- Voice message food logging
- Image recognition for food labels
- Meal planning suggestions
- Nutritional advice and insights

### Phase 3: Advanced Features

- Integration with fitness apps (MyFitnessPal, Strava)
- Weekly and monthly reports with visualizations
- Social features (sharing, competitions)
- Personalized nutrition coaching

### Phase 4: Scale & Monetization

- Premium features for power users
- API for third-party integrations
- White-label solutions for nutritionists
- Advanced analytics and reporting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Recent Improvements (v2.0)

### 🔧 Bug Fixes

- **Fixed double logging issue**: Messages are no longer logged twice when using conversational AI
- **Enhanced intent detection**: Bot now distinguishes between food logging and food questions using AI
- **Improved error handling**: Better fallbacks when AI services are unavailable
- **🆕 Fixed nutritional accuracy**: No more generic 200-calorie defaults for all foods
- **🆕 Better modification detection**: "and one apple" now correctly adds to recent meal

### 🤖 Enhanced AI Capabilities

- **Smart intent recognition**: Uses Groq AI to understand whether user wants to log food or ask questions
- **Conversational memory**: Bot remembers recent conversation context for better responses
- **Personalized nutrition advice**: Answers questions based on user's current intake and goals
- **Context-aware responses**: Understands follow-up questions and references
- **🆕 Accurate nutritional data**: Uses real food database instead of fallback estimates

### 🗣️ Conversational Features

- **Natural food logging**: Say "I had 2 eggs" instead of using commands
- **Nutrition Q&A**: Ask "What should I eat more of?" and get personalized advice
- **Smart fallbacks**: Graceful handling when intent is unclear
- **Conversation context**: Bot remembers recent messages for better understanding
- **🆕 Food modifications**: "and one apple" adds to recent meal, "with milk" updates coffee entry

### 🎯 Nutritional Accuracy Improvements

Based on research showing that [not all calories are equal](https://theconversation.com/not-all-calories-are-equal-a-dietitian-explains-the-different-ways-the-kinds-of-foods-you-eat-matter-to-your-body-156900) and [calorie quality matters](https://www.healthline.com/nutrition/6-reasons-why-a-calorie-is-not-a-calorie), we've significantly improved our nutritional tracking:

**Before (v1.0):**

- Everything defaulted to: 200 cal | 10g protein | 20g carbs | 8g fat ❌
- AI parsing failures led to inaccurate data
- No distinction between food types

**After (v2.0):**

- **Apple**: 95 cal | 0.5g protein | 25g carbs | 0.3g fat ✅
- **Coffee**: 2 cal | 0.3g protein | 0g carbs | 0g fat ✅
- **Coffee with milk**: 45 cal | 2.4g protein | 3.6g carbs | 1.7g fat ✅
- Real nutritional data from comprehensive food database
- Accurate macronutrient profiles for different food types

**Key Nutritional Features:**

- **150+ foods**: Comprehensive database with accurate nutrition data
- **Smart fallbacks**: When AI fails, uses food database instead of generic values
- **Portion awareness**: Handles quantities correctly (2 apples = 190 calories)
- **Context combinations**: "coffee" + "with milk" = proper combined nutrition

### Example Conversations

**Food Logging:**

```
User: "Just had a chicken breast with rice"
Bot: Got it! I logged:
     🍽️ chicken breast (1 serving)
     📊 165 cal | 31g protein | 0g carbs | 3.6g fat
     ...
```

**Food Modifications:**

```
User: "I had 1 coffee"
Bot: Got it! I logged:
     🍽️ coffee (1 cup)
     📊 2 cal | 0.3g protein | 0g carbs | 0g fat

User: "with milk"
Bot: ✅ Updated your coffee entry!
     🍽️ coffee with milk
     📊 45 cal | 2.4g protein | 3.6g carbs | 1.7g fat
```

**Nutrition Questions:**

```
User: "What do I need to eat more today?"
Bot: Based on your goals, you need 50g more protein today.
     Try some Greek yogurt, chicken, or beans! 🍗
     Don't forget to log it when you eat!
```
