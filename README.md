# AI-Powered Quiz Generator 🧠✨

A collaborative web application that uses AI to automatically generate interactive quizzes from PDF documents. Play solo or compete with friends in real-time multiplayer mode!

## 🌟 Features

### 📄 PDF Upload & Processing

- Drag-and-drop or click to upload PDF files
- Support for PDFs up to 10MB
- Automatic text extraction and preprocessing
- Smart content analysis

### 🤖 AI-Powered Quiz Generation

- Powered by **DeepSeek V3.1** via OpenRouter
- Generates 5-50 customizable multiple-choice questions
- Each question includes:
  - Clear, fact-based question
  - Four answer options
  - One correct answer
  - Detailed explanation
- Intelligent content filtering and validation

### 🎮 Dual Game Modes

#### Solo Mode

- Play at your own pace
- Immediate feedback after each answer
- Time tracking per question
- Comprehensive score and review

#### Multiplayer Mode

- Real-time WebSocket communication
- Create or join quiz rooms with unique codes
- Live player lobby with participant tracking
- Real-time leaderboard updates
- Time-based scoring system (faster = more points)
- Host controls quiz progression

### 🎨 Beautiful UI/UX

- Smooth animations with Framer Motion
- Gradient designs and modern styling
- Responsive layout for all devices
- Interactive feedback and transitions
- Progress tracking and visual indicators

### 📊 Results & Analytics

- Individual score breakdown
- Correct/incorrect answer review
- Detailed explanations for each question
- Multiplayer leaderboard with rankings
- Trophy/medal system for top performers

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4
- **Styling:** TailwindCSS 4
- **Animations:** Framer Motion
- **AI Model:** DeepSeek V3.1 (via OpenRouter)
- **PDF Parsing:** pdf-parse
- **Real-time Communication:** Socket.IO
- **Language:** JavaScript/React

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload-pdf/
│   │   │   │   └── route.js          # PDF upload & quiz generation endpoint
│   │   │   └── socket/
│   │   │       └── route.js          # WebSocket endpoint
│   │   ├── globals.css               # Global styles
│   │   ├── layout.js                 # Root layout
│   │   └── page.js                   # Main application page
│   ├── components/
│   │   ├── PDFUploader.js            # PDF upload component
│   │   ├── QuizMode.js               # Solo/Multiplayer selection
│   │   ├── MultiplayerLobby.js       # Waiting room for multiplayer
│   │   ├── QuizQuestion.js           # Question display & interaction
│   │   └── QuizResults.js            # Results & leaderboard
│   └── lib/
│       ├── openai.js                 # OpenRouter/DeepSeek integration
│       ├── pdfParser.js              # PDF text extraction
│       └── socket.js                 # Socket.IO server logic
├── server.js                         # Custom server with Socket.IO
├── .env.local                        # Environment variables
├── package.json                      # Dependencies
└── next.config.mjs                   # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenRouter API key (free tier available)

### Installation

1. **Navigate to project directory**

   ```bash
   cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
   ```

2. **Dependencies are already installed!**

3. **Configure environment variables**

   Edit `.env.local` and add your OpenRouter API key:

   ```env
   OPENROUTER_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_NAME=AI Quiz Generator
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Creating a Quiz

1. **Upload PDF**

   - Drag and drop a PDF file or click to browse
   - Select the number of questions (5-50)
   - Click "Generate Quiz"
   - Wait for AI to analyze and create questions

2. **Choose Mode**
   - **Solo Mode:** Practice alone with instant feedback
   - **Multiplayer Mode:** Compete with friends

### Solo Mode

1. Answer each question by selecting an option
2. Receive immediate feedback with explanations
3. Auto-progress to next question
4. View comprehensive results at the end

### Multiplayer Mode

1. **As Host:**

   - Enter your name
   - Click "Create Room"
   - Share the 6-character room code with friends
   - Wait for players to join
   - Click "Start Quiz" when ready

2. **As Player:**

   - Enter your name
   - Click "Join Room"
   - Enter the room code
   - Wait for host to start

3. **During Quiz:**
   - Answer questions as they appear
   - Earn points for correct answers
   - Get time bonuses for faster responses
   - View leaderboard after completion

## 🔑 API Configuration

### Getting OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env.local`

### DeepSeek V3.1 Model

The app uses `deepseek/deepseek-chat-v3.1:free` which offers:

- Free tier access
- High-quality quiz generation
- Fast response times
- Reliable JSON output

## 🎯 Features in Detail

### Scoring System

- **Solo Mode:** Simple correct/incorrect counting
- **Multiplayer Mode:**
  - Base: 100 points per correct answer
  - Time Bonus: Up to 50 extra points (faster = more)
  - Formula: `100 + max(0, 50 - (timeInSeconds * 2))`

### Security & Content Filtering

- PDF size validation (max 10MB)
- File type verification
- Content length optimization
- Error handling and user feedback
- Automatic text cleaning and preprocessing

### Real-time Features

- Instant player join/leave notifications
- Live leaderboard updates
- Synchronized quiz progression
- Host disconnect handling
- Room state management

## 🐛 Troubleshooting

### Common Issues

**Quiz generation fails:**

- Check API key in `.env.local`
- Verify PDF is valid and readable
- Ensure PDF has sufficient text content

**Multiplayer not working:**

- Confirm server is running on port 3000
- Check WebSocket connection in browser console
- Verify firewall isn't blocking connections

**PDF upload errors:**

- Ensure file is actually a PDF
- Check file size is under 10MB
- Try a different PDF if issues persist

## 📝 Environment Variables

| Variable                    | Description              | Example                 |
| --------------------------- | ------------------------ | ----------------------- |
| `OPENROUTER_API_KEY`        | Your OpenRouter API key  | `sk-or-v1-...`          |
| `NEXT_PUBLIC_SITE_URL`      | Your site URL            | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_NAME`     | Site name for OpenRouter | `AI Quiz Generator`     |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket server URL     | `http://localhost:3000` |

## 🚀 Production Deployment

For production deployment:

1. Update environment variables for production domain
2. Build the application:
   ```bash
   npm run build
   ```
3. Start production server:
   ```bash
   npm start
   ```

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 💡 Future Enhancements

- [ ] Export quiz results as PDF
- [ ] Save quizzes for later use
- [ ] Multiple quiz formats (true/false, fill-in-blank)
- [ ] User accounts and quiz history
- [ ] Advanced analytics and insights
- [ ] Custom quiz themes
- [ ] Mobile app version

---

**Built with ❤️ using Next.js and AI**
