# 🎯 APPLICATION ARCHITECTURE OVERVIEW

## Complete AI-Powered Quiz Generator System

### 📋 Project Summary

This is a **full-stack Next.js application** that leverages AI to create interactive quizzes from PDF documents with both solo and multiplayer capabilities.

---

## 🏗️ Architecture Components

### 1. **Frontend Layer** (React/Next.js)

```
src/app/page.js - Main application orchestrator
├── PDFUploader Component - File upload interface
├── QuizMode Component - Mode selection (Solo/Multiplayer)
├── MultiplayerLobby Component - Waiting room
├── QuizQuestion Component - Question display & interaction
└── QuizResults Component - Results & leaderboard
```

### 2. **Backend API Layer** (Next.js API Routes)

```
src/app/api/
├── upload-pdf/route.js - Handles PDF processing & AI quiz generation
└── socket/route.js - WebSocket endpoint placeholder
```

### 3. **Real-time Communication Layer** (Socket.IO)

```
server.js - Custom Node.js server with Socket.IO
└── Manages room creation, player management, quiz synchronization
```

### 4. **AI Integration Layer** (OpenRouter/DeepSeek)

```
src/lib/openai.js - DeepSeek V3.1 integration
└── Generates quizzes with structured prompts
```

### 5. **Utility Layer**

```
src/lib/
├── pdfParser.js - PDF text extraction
└── socket.js - Socket.IO utilities (not actively used)
```

---

## 🔄 Data Flow

### **Quiz Generation Flow:**

```
1. User uploads PDF → PDFUploader Component
2. File sent to /api/upload-pdf endpoint
3. PDF parsed by pdfParser.js
4. Text sent to DeepSeek AI via openai.js
5. AI generates quiz questions in JSON format
6. Quiz data returned to frontend
7. User selects game mode
```

### **Solo Mode Flow:**

```
1. User starts quiz immediately
2. Answers tracked locally in state
3. Immediate feedback after each answer
4. Results displayed at end
```

### **Multiplayer Mode Flow:**

```
1. Host creates room via Socket.IO
2. Room code generated and shared
3. Players join using room code
4. Host starts quiz
5. Questions synchronized across all players
6. Answers submitted via WebSocket
7. Leaderboard calculated in real-time
8. Results shown to all players simultaneously
```

---

## 🗂️ File Structure & Purpose

### **Core Application Files**

| File              | Purpose            | Key Features                                  |
| ----------------- | ------------------ | --------------------------------------------- |
| `src/app/page.js` | Main app component | State management, routing, socket integration |
| `server.js`       | Custom server      | Socket.IO server, room management             |
| `.env.local`      | Environment config | API keys, URLs                                |
| `package.json`    | Dependencies       | Project metadata, scripts                     |

### **Component Files**

| Component             | Responsibility   | Props                                                                     |
| --------------------- | ---------------- | ------------------------------------------------------------------------- |
| `PDFUploader.js`      | PDF upload UI    | `onQuizGenerated`                                                         |
| `QuizMode.js`         | Mode selection   | `onSelectMode`                                                            |
| `MultiplayerLobby.js` | Waiting room     | `socket`, `roomCode`, `isHost`, `onStartQuiz`                             |
| `QuizQuestion.js`     | Question display | `question`, `questionIndex`, `totalQuestions`, `onAnswer`, `showFeedback` |
| `QuizResults.js`      | Results display  | `quiz`, `userAnswers`, `leaderboard`, `onPlayAgain`                       |

### **Library Files**

| Library        | Purpose          | Key Functions                     |
| -------------- | ---------------- | --------------------------------- |
| `openai.js`    | AI integration   | `generateQuizFromText()`          |
| `pdfParser.js` | PDF processing   | `parsePDF()`                      |
| `socket.js`    | Socket utilities | Socket event handlers (reference) |

---

## 🎨 UI/UX Design Pattern

### **Color Scheme**

- Primary: Blue (#3B82F6) → Gradients to Purple (#9333EA)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Background: Multi-gradient (Blue → Purple → Pink)

### **Animation Strategy**

- **Framer Motion** for all transitions
- Entry animations: `opacity: 0 → 1`, `y: 20 → 0`
- Exit animations: `opacity: 1 → 0`, `y: 0 → -20`
- Hover effects: `scale: 1 → 1.05`
- Tap effects: `scale: 1 → 0.98`

### **Responsive Design**

- Mobile-first approach
- Tailwind CSS breakpoints
- Flexible grid layouts
- Touch-optimized interactions

---

## 🔐 Security Considerations

### **Input Validation**

- ✅ File type checking (PDF only)
- ✅ File size limits (10MB max)
- ✅ Content length optimization (32K chars)
- ✅ Question count validation (5-50)

### **API Security**

- ✅ Environment variable protection
- ✅ Server-side API calls only
- ✅ Error handling with safe messages

### **WebSocket Security**

- ✅ CORS configuration
- ✅ Room code validation
- ✅ Host verification for actions

---

## 🚀 Performance Optimizations

### **Frontend**

- Client-side rendering for interactive components
- Lazy state updates
- Optimized re-renders with React hooks
- AnimatePresence for smooth transitions

### **Backend**

- Streamed PDF processing
- Text truncation for token limits
- Efficient room state management
- Connection pooling in Socket.IO

### **AI Integration**

- Smart prompt engineering
- JSON parsing with fallbacks
- Temperature tuning (0.7)
- Token limit awareness

---

## 📊 State Management

### **Application States**

```javascript
- stage: 'upload' | 'mode' | 'lobby' | 'quiz' | 'results'
- quiz: Array of question objects
- mode: 'solo' | 'multiplayer'
- socket: Socket.IO client instance
- roomCode: String (6 chars)
- currentQuestion: Number
- userAnswers: Array of answer indices
- leaderboard: Array of player scores
```

### **Room State (Server)**

```javascript
{
  quiz: Array of questions,
  host: Socket ID,
  hostName: String,
  players: Map of player data,
  currentQuestion: Number,
  started: Boolean
}
```

---

## 🔌 API Endpoints

### **REST APIs**

#### `POST /api/upload-pdf`

**Request:**

```javascript
FormData {
  file: PDF File
  numberOfQuestions: Number (5-50)
}
```

**Response:**

```javascript
{
  success: true,
  quiz: [
    {
      question: String,
      options: [String, String, String, String],
      correctAnswer: Number (0-3),
      explanation: String
    }
  ],
  metadata: {
    fileName: String,
    numPages: Number,
    numberOfQuestions: Number
  }
}
```

### **WebSocket Events**

#### Client → Server

- `create-room`: Create new quiz room
- `join-room`: Join existing room
- `start-quiz`: Host starts quiz
- `submit-answer`: Player submits answer
- `next-question`: Host moves to next question
- `get-leaderboard`: Request current standings

#### Server → Client

- `room-created`: Room successfully created
- `player-joined`: New player joined
- `player-left`: Player disconnected
- `quiz-started`: Quiz began
- `next-question`: Move to next question
- `quiz-finished`: Quiz completed
- `answer-result`: Answer feedback
- `leaderboard-update`: Updated scores
- `host-disconnected`: Host left
- `error`: Error message

---

## 🧪 Testing Recommendations

### **Unit Tests**

- [ ] PDF parsing functions
- [ ] Quiz generation validation
- [ ] Scoring calculations
- [ ] Room state management

### **Integration Tests**

- [ ] PDF upload → Quiz generation flow
- [ ] Socket.IO event handling
- [ ] API error handling

### **E2E Tests**

- [ ] Complete solo quiz workflow
- [ ] Complete multiplayer workflow
- [ ] Room creation and joining
- [ ] Concurrent player interactions

---

## 📦 Dependencies Breakdown

### **Core**

- `next`: Framework
- `react`, `react-dom`: UI library
- `socket.io`, `socket.io-client`: Real-time communication

### **AI & Processing**

- `openai`: AI client (OpenRouter compatible)
- `pdf-parse`: PDF text extraction

### **UI & Animations**

- `tailwindcss`: Utility-first CSS
- `framer-motion`: Animation library
- `lucide-react`: Icon library

### **Utilities**

- `axios`: HTTP client (installed but not actively used)

---

## 🔧 Configuration Files

### **next.config.mjs**

- Webpack configuration for PDF parsing
- Canvas alias disabled for compatibility

### **package.json**

- Custom dev script: `node server.js`
- Production script: Custom server

### **.env.local**

- `OPENROUTER_API_KEY`: Your API key
- `NEXT_PUBLIC_SITE_URL`: Site URL for OpenRouter
- `NEXT_PUBLIC_SITE_NAME`: Site name
- `NEXT_PUBLIC_WEBSOCKET_URL`: WebSocket endpoint

---

## 🎯 Key Design Decisions

### **Why Custom Server?**

- Socket.IO requires HTTP server instance
- Next.js standalone doesn't expose server
- Custom server.js provides full control

### **Why DeepSeek V3.1?**

- Free tier available
- Excellent JSON output
- Fast response times
- Good instruction following

### **Why Socket.IO over WebRTC?**

- Simpler implementation
- Built-in room management
- Automatic reconnection
- Easier state synchronization

### **Why Framer Motion?**

- Declarative animations
- React-first design
- Smooth transitions
- Easy to use

---

## 📈 Scalability Considerations

### **Current Limitations**

- In-memory room storage (lost on restart)
- Single server instance
- No persistent user data

### **Scaling Strategies**

1. **Database Integration**

   - Redis for room state
   - PostgreSQL for quiz history
   - MongoDB for user data

2. **Horizontal Scaling**

   - Socket.IO Redis adapter
   - Load balancer
   - Sticky sessions

3. **Caching**
   - Quiz result caching
   - PDF processing cache
   - AI response caching

---

## ✨ Future Enhancement Ideas

### **Short Term**

- [ ] Add sound effects
- [ ] Add timer countdown
- [ ] Add difficulty levels
- [ ] Export quiz to JSON

### **Medium Term**

- [ ] User authentication
- [ ] Quiz history
- [ ] Custom quiz creation
- [ ] Quiz sharing

### **Long Term**

- [ ] Mobile app
- [ ] Quiz marketplace
- [ ] Advanced analytics
- [ ] Multi-language support

---

## 🎓 Learning Resources

### **Technologies Used**

- [Next.js Docs](https://nextjs.org/docs)
- [Socket.IO Docs](https://socket.io/docs/)
- [Framer Motion](https://www.framer.com/motion/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [OpenRouter](https://openrouter.ai/docs)

---

**Architecture Created:** October 7, 2025  
**Framework:** Next.js 15.5.4  
**Status:** Production Ready ✅
