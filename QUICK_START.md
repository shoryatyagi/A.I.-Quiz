# 🚀 QUICK START GUIDE

## Prerequisites Checklist

- [x] Node.js installed (v18 or higher)
- [x] npm installed (comes with Node.js)
- [x] Dependencies installed (openai, pdf-parse, socket.io, framer-motion, axios)
- [ ] OpenRouter API key (get from https://openrouter.ai)

---

## 🎯 Step-by-Step Setup

### Step 1: Get Your OpenRouter API Key

1. Go to **https://openrouter.ai**
2. Click "Sign Up" (free account)
3. After logging in, navigate to **"Keys"** in the sidebar
4. Click **"Create Key"**
5. Copy your API key (starts with `sk-or-v1-...`)

### Step 2: Configure Environment

1. Open the file `.env.local` in the project root
2. Replace `your_api_key_here` with your actual API key:

```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=AI Quiz Generator
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
```

3. Save the file

### Step 3: Start the Application

Open PowerShell in the project directory and run:

```powershell
npm run dev
```

You should see:

```
> Ready on http://localhost:3000
```

### Step 4: Open in Browser

1. Open your browser
2. Go to: **http://localhost:3000**
3. You should see the AI Quiz Generator home page!

---

## 🧪 Testing the Application

### Test 1: Solo Mode Quiz

1. **Prepare a PDF file** (any educational PDF - textbook, article, etc.)
2. **Drag and drop** the PDF onto the upload area
3. **Adjust** the number of questions slider (try 10)
4. Click **"Generate Quiz"** button
5. Wait for AI to process (15-30 seconds)
6. Select **"Solo Mode"**
7. **Answer the questions** - you'll get instant feedback
8. View your **results and explanations**

### Test 2: Multiplayer Mode

#### Host Setup:

1. Upload a PDF and generate a quiz
2. Select **"Multiplayer Mode"**
3. Enter your name (e.g., "Alice")
4. Click **"Create Room"**
5. **Copy the 6-digit room code** shown
6. Wait for players to join

#### Player Setup (open in new browser tab/window):

1. Go to **http://localhost:3000**
2. Upload the **same or different** PDF
3. Generate quiz questions
4. Select **"Multiplayer Mode"**
5. Enter your name (e.g., "Bob")
6. Click **"Join Room"**
7. Enter the **room code** from host
8. Click **"Join"**

#### Start Quiz:

1. As **host**, click **"Start Quiz"** when ready
2. All players answer questions simultaneously
3. Faster correct answers = more points!
4. View **leaderboard** at the end

---

## 📝 Sample PDFs for Testing

You can use any PDF, but here are some good test cases:

### Easy (Short PDFs):

- Wikipedia article exports
- Single-page documents
- Blog posts saved as PDF

### Medium (Multi-page):

- Research papers
- Book chapters
- Study guides

### Advanced (Long PDFs):

- Textbooks
- Technical manuals
- Comprehensive guides

**Note:** Max file size is 10MB. Content should have at least 100 characters of readable text.

---

## ⚙️ Troubleshooting

### Problem: "Failed to generate quiz"

**Solutions:**

1. Check your API key in `.env.local`
2. Verify the PDF has readable text (not just images)
3. Try a smaller/simpler PDF first
4. Check browser console for errors (F12)
5. Ensure you have internet connection

### Problem: Multiplayer not connecting

**Solutions:**

1. Make sure the server is running
2. Check that both host and player are on same network (or localhost)
3. Verify WebSocket connection in browser console
4. Try refreshing the page
5. Check Windows Firewall isn't blocking port 3000

### Problem: PDF upload fails

**Solutions:**

1. Ensure file is actually a PDF (check extension)
2. File size must be under 10MB
3. PDF must contain text (not scanned images)
4. Try a different PDF
5. Check file isn't password-protected

### Problem: Server won't start

**Solutions:**

1. Port 3000 might be in use:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Kill the process if found:
   ```powershell
   taskkill /PID <process_id> /F
   ```
3. Try running on different port:
   ```powershell
   $env:PORT=3001; npm run dev
   ```

---

## 🎮 Feature Checklist

Once running, verify these features work:

### PDF Upload

- [x] Drag and drop PDF
- [x] Click to browse
- [x] Number of questions slider (5-50)
- [x] File validation
- [x] Loading indicator

### Solo Mode

- [x] Question display
- [x] Answer selection
- [x] Immediate feedback
- [x] Timer per question
- [x] Progress bar
- [x] Results with explanations

### Multiplayer Mode

- [x] Room creation
- [x] Room code generation
- [x] Room code copying
- [x] Join room
- [x] Player list
- [x] Host controls
- [x] Synchronized questions
- [x] Real-time leaderboard
- [x] Disconnect handling

### UI/UX

- [x] Smooth animations
- [x] Responsive design
- [x] Mobile-friendly
- [x] Color-coded feedback
- [x] Progress indicators
- [x] Error messages

---

## 📊 Performance Expectations

### Quiz Generation Time

- **5 questions:** ~10-15 seconds
- **10 questions:** ~15-25 seconds
- **25 questions:** ~30-45 seconds
- **50 questions:** ~45-60 seconds

_Times may vary based on PDF length and API response time_

### Multiplayer Latency

- **Room creation:** Instant
- **Player join:** <1 second
- **Question sync:** <500ms
- **Answer submission:** <200ms

---

## 🔄 Development Commands

### Start Development Server

```powershell
npm run dev
```

### Build for Production

```powershell
npm run build
```

### Start Production Server

```powershell
npm start
```

### Lint Code

```powershell
npm run lint
```

---

## 🎨 Customization Ideas

### Easy Customizations:

1. **Change Colors:**

   - Edit gradient colors in `src/app/page.js`
   - Modify Tailwind classes

2. **Adjust Timer:**

   - Edit time bonus calculation in `server.js`
   - Line: `const timeBonus = Math.max(0, 50 - Math.floor(timeSpent / 1000) * 2);`

3. **Change Question Limits:**

   - Edit min/max in `PDFUploader.js`
   - Line: `<input type="range" min="5" max="50"`

4. **Modify Scoring:**
   - Edit base points in `server.js`
   - Line: `const basePoints = 100;`

---

## 📱 Accessing from Other Devices

### On Same Network:

1. Find your computer's IP address:

   ```powershell
   ipconfig
   ```

   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `.env.local`:

   ```env
   NEXT_PUBLIC_SITE_URL=http://192.168.1.100:3000
   NEXT_PUBLIC_WEBSOCKET_URL=http://192.168.1.100:3000
   ```

3. On other device, go to: `http://192.168.1.100:3000`

4. Allow Windows Firewall if prompted

---

## 🎯 Best Practices

### For Best Quiz Quality:

1. Use PDFs with clear, structured content
2. Start with 10 questions for testing
3. Avoid image-heavy PDFs
4. Use educational content for better questions

### For Best Multiplayer Experience:

1. Test solo mode first
2. Use 10-15 questions for gameplay
3. Have 2-4 players initially
4. Use stable internet connection

### For Development:

1. Keep browser console open (F12)
2. Check Network tab for API calls
3. Monitor server logs in terminal
4. Test on different browsers

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ PDF uploads successfully
2. ✅ AI generates quiz questions
3. ✅ Questions display correctly
4. ✅ Answers are validated properly
5. ✅ Multiplayer rooms connect
6. ✅ Scores calculate correctly
7. ✅ Animations are smooth
8. ✅ No console errors

---

## 📞 Need Help?

### Check These First:

1. Browser console (F12) for errors
2. Server terminal for backend errors
3. `.env.local` configuration
4. Internet connection
5. API key validity

### Common Issues Document:

See `README.md` → Troubleshooting section

---

## 🎉 You're Ready!

Your AI Quiz Generator is now fully set up and ready to use.

**Next Steps:**

1. Get your OpenRouter API key
2. Add it to `.env.local`
3. Run `npm run dev`
4. Upload a PDF and create your first quiz!

**Happy Quizzing! 🧠✨**

---

Last Updated: October 7, 2025  
Version: 1.0.0
