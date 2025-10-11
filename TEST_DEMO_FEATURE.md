# 🧪 Test Demo Feature

## ✨ What's New?

Added a **Test Demo** button to the PDF Uploader that instantly loads 10 pre-defined questions **without making any API calls**. Perfect for testing the quiz flow without consuming API credits!

---

## 🎯 How to Use

### Step 1: Navigate to Quiz Creator

1. Start the application
2. Click on **Solo** or **Multiplayer** mode
3. The Quiz Creator page will load

### Step 2: Click Test Demo

1. You'll see the **PDF Uploader** tab (default)
2. Find the purple **"Test Demo"** button at the bottom right
3. Click it → Quiz starts instantly! ⚡

### Step 3: Take the Quiz

- No PDF upload needed
- No API call made
- 10 web development questions load immediately
- Quiz metadata is auto-filled:
  - **Title**: "Test Demo Quiz" (or custom name if entered)
  - **Topic**: "Web Development Basics"
  - **Difficulty**: Medium
  - **Question Count**: 10

---

## 📚 Test Demo Questions

The demo includes 10 questions about **Web Development Basics**:

1. **HTML** - What does HTML stand for?
2. **CSS** - Text color property
3. **JavaScript** - External script syntax
4. **HTML** - Unordered list tag
5. **CSS** - What does CSS stand for?
6. **JavaScript** - getElementById() method
7. **HTML** - Largest heading tag
8. **CSS** - Font family property
9. **CSS** - Default position value
10. **JavaScript** - Single-line comment syntax

All questions are **multiple choice** with 4 options each, following the exact same format as API-generated quizzes.

---

## 🔧 Technical Details

### Component: `PDFUploader.js`

**New Constant:**

```javascript
const TEST_DEMO_QUESTIONS = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language",
      "Hyperlinking Text Marking Language",
    ],
    answer: "Hyper Text Markup Language",
  },
  // ... 9 more questions
];
```

**New Function:**

```javascript
const handleTestDemo = () => {
  const metadata = {
    title: quizName.trim() || "Test Demo Quiz",
    topic: "Web Development Basics",
    difficulty: "medium",
    questionCount: 10,
    source: "test-demo",
  };

  onQuizGenerated(TEST_DEMO_QUESTIONS, metadata);
};
```

**New Button:**

```javascript
<button
  type="button"
  onClick={handleTestDemo}
  disabled={loading}
  className="... bg-purple-600 ..."
>
  <Zap className="w-5 h-5" />
  Test Demo
</button>
```

---

## ✅ Benefits

1. **No API Calls** - Test without consuming OpenRouter credits
2. **Instant Loading** - Questions appear immediately
3. **Full Functionality** - Tests entire quiz flow:
   - Question rendering
   - Answer selection
   - Score calculation
   - Results display
   - History saving (if authenticated)
4. **Solo & Multiplayer** - Works in both modes:
   - **Solo**: Take quiz alone
   - **Multiplayer**: Host can use test demo for room creation
5. **Always Available** - No internet connection needed for demo questions

---

## 🎨 UI Changes

- **Test Demo Button**:

  - Color: Purple (`bg-purple-600`)
  - Icon: Zap (⚡)
  - Position: Left of "Generate Quiz" button
  - Always enabled (no file upload required)

- **Generate Quiz Button**:
  - Stays in original position
  - Still requires PDF file
  - Blue color (`bg-[#135bec]`)

---

## 🧪 Testing Workflow

### Before (with API):

1. Upload PDF file ⏱️
2. Wait for API processing ⏱️
3. API generates questions ⏱️
4. Quiz loads ✅

**Total Time**: 10-30 seconds  
**API Credits Used**: Yes ❌

### After (with Test Demo):

1. Click "Test Demo" button
2. Quiz loads instantly ✅

**Total Time**: < 1 second  
**API Credits Used**: No ✅

---

## 🚀 Use Cases

1. **Development Testing**

   - Quick UI testing
   - Component behavior verification
   - State management testing

2. **Feature Testing**

   - Quiz navigation
   - Answer submission
   - Results calculation
   - History saving

3. **Multiplayer Testing**

   - Room creation
   - Player joining
   - Quiz synchronization
   - Leaderboard display

4. **Demo/Presentation**
   - Show quiz functionality
   - No setup needed
   - Consistent questions

---

## 📝 Notes

- **Custom Quiz Name**: You can still enter a custom quiz name before clicking "Test Demo"
- **Number of Questions**: Ignored for test demo (always 10 questions)
- **Question Shuffling**: Options are shuffled like regular quizzes
- **History Integration**: Test demo quizzes are saved to history with `source: "test-demo"` metadata
- **No Conflicts**: Test demo doesn't interfere with PDF or AI quiz generation

---

## 🎉 Perfect For

✅ Quick functionality testing  
✅ UI/UX verification  
✅ Multiplayer flow testing  
✅ Demo presentations  
✅ Development without API limits  
✅ Offline testing

**Now you can test the quiz app anytime, anywhere, without API calls!** 🚀
