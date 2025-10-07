# Generate Quiz Button Guide 🎯

## Date: October 7, 2025

## Button Location & Appearance

### ✅ **The "Generate Quiz" Button is NOW VISIBLE**

**Location:** Bottom right of each form (PDF Upload or AI Prompt)

**Appearance:**

- **Color:** Blue (#135bec) - Primary brand color
- **Icon:** Sparkles icon (✨) on the left
- **Text:** "Generate Quiz"
- **Size:** Large, prominent button (px-6 py-3)
- **Shadow:** Subtle shadow for depth

---

## How to Use

### 📄 **PDF Upload Tab**

1. **Upload a PDF file:**

   - Drag and drop a PDF into the upload area, OR
   - Click the "Browse Files" button to select a PDF

2. **Adjust Settings:**

   - Use the slider to select number of questions (5-50)
   - Default is 10 questions

3. **Generate Quiz Button:**

   - ❌ **DISABLED (grayed out):** If no PDF is uploaded
     - Shows message: "Please upload a PDF file to continue"
     - Button is at 50% opacity
   - ✅ **ENABLED (bright blue):** After uploading a PDF
     - Full brightness, clickable
     - Click to generate quiz!

4. **Click Button:**
   - Button changes to "Generating Quiz..." with spinner
   - Quiz is created and you proceed to quiz screen

---

### 🤖 **AI Prompt Tab**

1. **Enter AI Prompt:**

   - Type your quiz topic in the large textarea
   - Example: "Create a 10-question multiple-choice quiz about the history of the internet."

2. **Adjust Settings:**

   - Use the slider to select number of questions (5-20)
   - Select difficulty: Easy / Medium / Hard (all buttons turn blue when selected)

3. **Generate Quiz Button:**

   - ❌ **DISABLED (grayed out):** If prompt is empty
     - Shows message: "Please enter an AI prompt to continue"
     - Button is at 50% opacity
   - ✅ **ENABLED (bright blue):** After typing a prompt
     - Full brightness, clickable
     - Click to generate quiz!

4. **Click Button:**
   - Button changes to "Generating Quiz..." with spinner
   - Quiz is created and you proceed to quiz screen

---

## Visual States

### Button States:

#### **Normal (Enabled):**

```
┌─────────────────────────────┐
│  ✨  Generate Quiz          │  ← Blue background (#135bec)
└─────────────────────────────┘     White text
                                     Shadow effect
                                     Hover: 90% opacity
```

#### **Disabled:**

```
┌─────────────────────────────┐
│  ✨  Generate Quiz          │  ← Blue background at 50% opacity
└─────────────────────────────┘     White text
                                     No shadow
                                     Cursor: not-allowed
                                     Helper text above:
                                     "Please upload a PDF file to continue"
```

#### **Loading:**

```
┌─────────────────────────────┐
│  ⟳  Generating Quiz...      │  ← Blue background
└─────────────────────────────┘     Spinner animation
                                     White text
                                     Button disabled during loading
```

---

## Troubleshooting

### "I don't see the button!"

**Solution:** The button is ALWAYS there at the bottom right. Scroll down if needed.

### "The button is grayed out!"

**For PDF Upload:**

- ✅ Make sure you've uploaded a PDF file
- Look for the file name displayed in the upload area
- If you see "Drag and drop your PDF here", you haven't uploaded yet

**For AI Prompt:**

- ✅ Make sure you've typed something in the textarea
- The prompt cannot be empty
- Type at least a few words describing your quiz

### "The button is blue but nothing happens!"

**Check:**

- ✅ Make sure you're clicking the button (not just hovering)
- ✅ Check browser console for errors (F12)
- ✅ Ensure you have internet connection (API calls needed)

### "Button stays on 'Generating Quiz...' forever"

**Possible causes:**

- API error (check console)
- Network timeout
- Server issue
- PDF parsing failed

**Solution:**

- Refresh the page and try again
- Try a different PDF file (smaller size, simpler content)
- Check your internet connection

---

## Complete Flow

### PDF Upload Flow:

```
1. Click "Solo Mode" on landing page
   ↓
2. See "From PDF" tab (blue) selected by default
   ↓
3. Upload PDF file (drag-drop or browse)
   ↓
4. Adjust number of questions slider (optional)
   ↓
5. "Generate Quiz" button becomes BLUE and CLICKABLE
   ↓
6. Click "Generate Quiz" button
   ↓
7. Button shows "Generating Quiz..." with spinner
   ↓
8. Quiz appears! Start playing! 🎉
```

### AI Prompt Flow:

```
1. Click "Solo Mode" on landing page
   ↓
2. Click "From AI Prompt" tab (turns blue)
   ↓
3. Type your quiz topic in textarea
   ↓
4. Adjust number of questions slider (optional)
   ↓
5. Select difficulty: Easy/Medium/Hard (optional)
   ↓
6. "Generate Quiz" button becomes BLUE and CLICKABLE
   ↓
7. Click "Generate Quiz" button
   ↓
8. Button shows "Generating Quiz..." with spinner
   ↓
9. Quiz appears! Start playing! 🎉
```

---

## Summary

✅ **Button is ALWAYS visible** at the bottom right
✅ **Blue color** (#135bec) when enabled
✅ **Grayed out** (50% opacity) when disabled
✅ **Helper text** explains why button is disabled
✅ **Sparkles icon** (✨) on the left
✅ **Shadow effect** for visual depth
✅ **Smooth transitions** on hover and state changes

**The button is there - just upload a file or type a prompt first!** 🚀
