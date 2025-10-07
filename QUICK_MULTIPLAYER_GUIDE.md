# Quick Start - Multiplayer Setup

## ✅ What's Been Done

1. **MongoDB Integration** - Rooms are now stored in MongoDB instead of memory
2. **Network Configuration** - Server now listens on all network interfaces (0.0.0.0)
3. **Auto URL Detection** - App automatically uses the correct WebSocket URL based on how you access it!

## 🚀 Next Steps

### 1. Configure Firewall (Windows) - REQUIRED!

**Option A: Run the setup script (Recommended)**

```powershell
# Run PowerShell as Administrator, then:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
.\setup-firewall.ps1
```

**Option B: Manual setup**

1. Open Windows Defender Firewall
2. Allow Node.js through firewall on port 3000
3. See `MULTIPLAYER_SETUP.md` for detailed instructions

### 2. Verify MongoDB is Running

```powershell
# Check if MongoDB is running
mongod --version

# If not running, start it:
net start MongoDB

# Or run manually:
mongod --dbpath "C:\data\db"
```

### 3. Get Your IP Address

```powershell
ipconfig | Select-String "IPv4"
```

Look for the IPv4 address (usually starts with 192.168.x.x). Example: `192.168.1.5`

### 4. Test the Setup

**On Host Device (your computer):**

1. Server is running at `http://0.0.0.0:3000`
2. Open browser and go to `http://localhost:3000`
3. You should see the mode selection screen (Solo/Multiplayer buttons)
4. Choose **Multiplayer** → Enter name → **Create Room**
5. Upload a PDF
6. Note the room code shown

**On Other Devices (phone, tablet, another PC):**

1. Make sure they're on the **same Wi-Fi network**
2. Find your host IP (e.g., `192.168.1.5`)
3. Open browser and go to `http://192.168.1.5:3000` (use YOUR IP!)
4. You should see the same mode selection screen
5. Choose **Multiplayer** → Enter name → **Join Room**
6. Enter the room code from the host
7. Should see the lobby!

## 🔧 Troubleshooting

### "Can't connect from other device"

**Check these:**

```powershell
# 1. Verify your IP hasn't changed
ipconfig | Select-String "IPv4"

# 2. Check if server is running
# Should show: Ready on http://0.0.0.0:3000
```

**Update `.env.local` if IP changed:**

```bash
NEXT_PUBLIC_WEBSOCKET_URL=http://YOUR_NEW_IP:3000
```

**Then restart server:**

```powershell
# Press Ctrl+C to stop the server, then:
npm run dev
```

### "Room not found"

**Make sure:**

1. MongoDB is running: `mongod --version`
2. Host created the room first
3. Room code is typed correctly (case-sensitive)

### Still not working?

See `MULTIPLAYER_SETUP.md` for detailed troubleshooting guide.

## 📱 How to Connect

### From Same Computer:

- Use: `http://localhost:3000`

### From Same Network (Wi-Fi):

- Use: `http://192.168.1.5:3000` (your actual IP)

### From Internet (Not Configured Yet):

- Requires deployment to cloud service
- See deployment guides for Vercel/Railway

## 🎮 Room Flow

1. **Host**: Create Room → Upload PDF → Wait in Lobby → Start Quiz
2. **Players**: Join Room → Wait in Lobby → Quiz Starts Automatically

## 📊 Current Configuration

- **Server**: `http://0.0.0.0:3000` (all interfaces)
- **WebSocket**: `http://192.168.1.5:3000`
- **MongoDB**: `mongodb://localhost:27017`
- **Database**: `quizapp`

## ⚡ Performance Tips

- Keep PDF size under 5MB for faster processing
- Recommended: 5-10 questions for smooth experience
- Max players: 10-15 per room (for best performance)

---

**Need help?** Check `MULTIPLAYER_SETUP.md` for comprehensive guide!
