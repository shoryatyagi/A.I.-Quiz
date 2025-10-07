# Blank Screen Troubleshooting

If you see a blank screen (only header and footer, no content), follow these steps:

## ✅ Quick Checks

### 1. Check Browser Console (F12)

Press F12 and look at the Console tab for errors. Common errors:

**"Failed to load resource" or "net::ERR_CONNECTION_REFUSED"**

- Server isn't running on host machine
- Firewall is blocking the connection
- Wrong IP address

**"WebSocket connection failed"**

- Socket.IO can't connect
- Check if MongoDB is running
- Verify firewall allows port 3000

### 2. Verify Server is Running

On the **host machine**, check the terminal:

```
✓ Ready on http://0.0.0.0:3000
```

If you don't see this:

```powershell
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
npm run dev
```

### 3. Test Basic Connectivity

On the **other device**, try accessing:

```
http://192.168.1.5:3000/_next/static/css/
```

(replace 192.168.1.5 with your host's IP)

**If this fails:** Connection problem (firewall/network)
**If this works:** Check browser console for JavaScript errors

### 4. Verify Firewall Settings

On the **host machine**:

```powershell
# Run as Administrator
Get-NetFirewallRule -DisplayName "*Node*" | Format-Table DisplayName, Enabled, Direction
```

Should show "Node.js Quiz App Server" as Enabled.

If not:

```powershell
# Run as Administrator
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
.\setup-firewall.ps1
```

### 5. Check MongoDB

```powershell
# Check if running
mongod --version

# If error, start MongoDB
net start MongoDB
```

### 6. Clear Browser Cache

On the **other device**:

1. Press Ctrl + Shift + Delete
2. Clear cached images and files
3. Reload the page (Ctrl + F5)

### 7. Verify Same Network

Both devices must be on the **same Wi-Fi network**.

**On host machine:**

```powershell
ipconfig | Select-String "IPv4"
```

**On other device:**

- Check Wi-Fi settings
- Ensure connected to same network name

## 🔍 Common Issues

### Issue: Page loads but stays blank

**Cause:** JavaScript not executing

**Solution:**

1. Check browser console (F12) for errors
2. Try a different browser
3. Disable browser extensions
4. Clear cache and reload

### Issue: Can't connect from other device

**Cause:** Network/firewall blocking

**Solution:**

```powershell
# On host, run as Administrator:
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
.\setup-firewall.ps1

# Then restart server:
npm run dev
```

### Issue: "Room not found"

**Cause:** MongoDB not running or room expired

**Solution:**

```powershell
# Start MongoDB
net start MongoDB

# Restart server
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
npm run dev
```

### Issue: Styles not loading (buttons not colored)

**Cause:** Tailwind CSS not built properly

**Solution:**

```powershell
# Clear build cache
cd e:\PYTHON\PYTHON_QUIZ_APP\my-app
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

## 🧪 Testing Steps

1. **On host computer:**

   - Open `http://localhost:3000`
   - Should see colorful Solo/Multiplayer buttons
   - Try clicking Solo and uploading a PDF

2. **On same computer (different tab):**

   - Open `http://localhost:3000`
   - Should see the same screen
   - This tests basic functionality

3. **On other device (same Wi-Fi):**
   - Find host IP: `ipconfig | Select-String "IPv4"`
   - Open `http://YOUR_IP:3000` (e.g., `http://192.168.1.5:3000`)
   - Should see the same screen
   - This tests network connectivity

## 📞 Still Not Working?

### Collect Debug Info

On the **host machine**:

```powershell
# Check server status
Get-Process -Name node

# Check what's listening on port 3000
netstat -ano | findstr :3000

# Check MongoDB status
Get-Service MongoDB

# Get IP addresses
ipconfig | Select-String "IPv4"
```

On the **other device**, check browser console (F12) and copy all errors.

### Alternative: Use localhost tunnel

If firewall/network issues persist, use a localhost tunnel:

```powershell
# Install ngrok
winget install --id Ngrok.Ngrok

# Run tunnel
ngrok http 3000
```

Then use the ngrok URL (e.g., `https://abc123.ngrok.io`) on any device.

## ✨ Expected Behavior

When working correctly:

**Host device (`http://localhost:3000`):**

- Loads in < 2 seconds
- Shows two large colored buttons (blue Solo, purple Multiplayer)
- Console shows: "Connected to server: [socket-id]"

**Other device (`http://192.168.1.5:3000`):**

- Loads in < 3 seconds
- Shows identical screen with two buttons
- Console shows: "Connected to server: [socket-id]"
- Console shows: "Connecting to WebSocket: http://192.168.1.5:3000"

Both should have NO red errors in console (F12 → Console tab).
