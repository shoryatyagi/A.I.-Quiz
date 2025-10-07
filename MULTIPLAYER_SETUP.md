# Multiplayer Setup Guide

This guide will help you set up the quiz app for multiplayer across multiple devices on the same network.

## Prerequisites

1. All devices must be on the **same Wi-Fi network**
2. MongoDB must be installed and running on the host machine
3. Firewall must allow connections on port 3000

## Step-by-Step Setup

### 1. Find Your Host Machine's IP Address

**On Windows:**

```powershell
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**On Mac/Linux:**

```bash
ifconfig
```

Look for "inet" address (usually starts with 192.168.x.x or 10.x.x.x)

**Example:** `192.168.1.5`

### 2. Update Environment Variables

Edit the `.env.local` file on the **host machine**:

```bash
# Replace with your actual IP address
NEXT_PUBLIC_WEBSOCKET_URL=http://192.168.1.5:3000
```

⚠️ **Important:** Replace `192.168.1.5` with YOUR actual IP address from Step 1.

### 3. Configure Windows Firewall (Windows Only)

Allow Node.js through the firewall:

1. Open **Windows Defender Firewall**
2. Click **Allow an app or feature through Windows Defender Firewall**
3. Click **Change settings** → **Allow another app**
4. Browse to your Node.js executable (usually `C:\Program Files\nodejs\node.exe`)
5. Check both **Private** and **Public** boxes
6. Click **OK**

**Or use PowerShell (Run as Administrator):**

```powershell
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
```

### 4. Start MongoDB

Make sure MongoDB is running:

```powershell
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod --dbpath "C:\data\db"
```

### 5. Start the Development Server

On the **host machine**, run:

```powershell
npm run dev
```

You should see:

```
✓ Ready on http://0.0.0.0:3000
```

### 6. Connect from Other Devices

On **other devices** (phones, tablets, other computers):

1. Open a web browser
2. Navigate to: `http://192.168.1.5:3000` (replace with your host's IP)
3. The app should load!

## Multiplayer Flow

### Host (Player Creating the Room):

1. Choose **Multiplayer** mode
2. Enter your name
3. Click **Create Room**
4. Upload a PDF
5. Wait for players to join in the lobby
6. Click **Start Quiz** when ready

### Players (Joining the Room):

1. Choose **Multiplayer** mode
2. Enter your name
3. Enter the **room code** shown on the host's screen
4. Click **Join Room**
5. Wait in the lobby until the host starts the quiz

## Troubleshooting

### "Room not found" error:

**Possible causes:**

1. MongoDB is not running on the host machine
2. Room code was typed incorrectly
3. Host hasn't created the room yet

**Solutions:**

- Verify MongoDB is running: `mongod --version`
- Double-check the room code (case-sensitive)
- Make sure host has clicked "Create Room"

### Can't connect from other devices:

**Possible causes:**

1. Devices are on different Wi-Fi networks
2. Firewall is blocking port 3000
3. Wrong IP address in `.env.local`

**Solutions:**

- Ensure all devices are on the same network
- Check firewall settings (see Step 3)
- Verify the IP address is correct:
  ```powershell
  # On host machine
  ipconfig | Select-String "IPv4"
  ```
- Restart the development server after changing `.env.local`

### Server won't start:

**Possible causes:**

1. Port 3000 is already in use
2. MongoDB connection failed
3. Node modules not installed

**Solutions:**

```powershell
# Kill any process using port 3000
netstat -ano | findstr :3000
taskkill /F /PID <PID_NUMBER>

# Reinstall dependencies
npm install

# Check MongoDB connection
mongosh mongodb://localhost:27017
```

### Quiz doesn't load for players:

**Possible causes:**

1. Host hasn't uploaded PDF yet
2. Network connection lost
3. Server crashed

**Solutions:**

- Host must upload PDF and create room first
- Check browser console for errors (F12)
- Restart the server on host machine

## Testing Locally (Same Device)

If you want to test on the same device without other devices:

1. Keep `.env.local` as:

   ```bash
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
   ```

2. Open multiple browser windows/tabs
3. One tab acts as host, others as players

## Production Deployment

For production deployment (making it accessible over the internet):

1. Deploy to a hosting service (Vercel, Railway, etc.)
2. Use MongoDB Atlas (cloud database) instead of local MongoDB
3. Update `NEXT_PUBLIC_WEBSOCKET_URL` to your production URL
4. Configure proper CORS settings

See `DEPLOYMENT.md` for detailed deployment instructions.

## Network Requirements

- **Protocol:** HTTP/WebSocket
- **Port:** 3000 (default)
- **Network:** Local network (LAN/Wi-Fi)
- **Bandwidth:** ~50KB per player per question
- **Latency:** < 500ms recommended

## Security Notes

⚠️ **Important Security Considerations:**

1. This setup is for **local network only** - not secure for public internet
2. All data is transmitted in **plain HTTP** (not encrypted)
3. No authentication or user validation
4. Room codes are simple 6-character codes (easily guessable)

For production use:

- Use HTTPS/WSS
- Implement proper authentication
- Add rate limiting
- Use secure room code generation
- Validate all user inputs

## Support

If you encounter issues not covered here:

1. Check the browser console (F12) for error messages
2. Check the server logs in your terminal
3. Verify all services are running:
   - Node.js server: `npm run dev`
   - MongoDB: `mongod --version`
4. Review the main `README.md` for general setup instructions
