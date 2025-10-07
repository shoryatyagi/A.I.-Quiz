# MongoDB Setup Guide

This application uses MongoDB to store multiplayer quiz room data. You have two options:

## Option 1: Local MongoDB (Recommended for Development)

### Windows Installation:

1. **Download MongoDB Community Server:**

   - Visit: https://www.mongodb.com/try/download/community
   - Download the MSI installer for Windows
   - Run the installer and follow the setup wizard
   - Choose "Complete" installation
   - Install MongoDB as a Service (recommended)

2. **Verify Installation:**

   ```powershell
   mongod --version
   ```

3. **Start MongoDB (if not running as service):**

   ```powershell
   mongod
   ```

4. **Your app is already configured** - The `.env.local` file is set to use local MongoDB:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=quizapp
   ```

## Option 2: MongoDB Atlas (Cloud - Free Tier)

If you want to use cloud MongoDB (allows connections from multiple devices):

1. **Create an Account:**

   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create a Cluster:**

   - Choose the FREE tier (M0)
   - Select a cloud provider and region close to you
   - Click "Create Cluster"

3. **Configure Database Access:**

   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose authentication method (Username/Password)
   - Create a username and strong password
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access:**

   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP address for security
   - Click "Confirm"

5. **Get Connection String:**

   - Go to "Database" (Clusters) in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

6. **Update .env.local:**
   - Open `.env.local` file
   - Replace the MONGODB_URI line with your connection string:
   ```
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=quizapp
   ```
   - Replace `yourusername`, `yourpassword`, and `yourcluster` with your actual values

## Testing the Connection

1. Start your application:

   ```powershell
   npm run dev
   ```

2. Look for this message in the console:

   ```
   Connected to MongoDB
   ```

3. If you see errors, check:
   - MongoDB service is running (for local)
   - Connection string is correct (for Atlas)
   - Network access is configured (for Atlas)
   - Username/password are correct (for Atlas)

## Database Structure

The app automatically creates:

- **Database:** `quizapp` (or your custom name)
- **Collection:** `rooms`
- **Indexes:**
  - `roomCode` (unique) - for fast room lookups
  - `createdAt` (TTL) - auto-deletes rooms after 1 hour

## Troubleshooting

### Local MongoDB not starting:

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB
```

### Connection refused:

- Ensure MongoDB is running
- Check firewall settings
- Verify port 27017 is not blocked

### Atlas connection timeout:

- Check IP whitelist in Network Access
- Verify connection string format
- Ensure internet connection is stable

## Security Notes

- **Never commit `.env.local`** to version control (it's already in `.gitignore`)
- Use strong passwords for MongoDB Atlas
- For production, restrict IP addresses in Network Access
- Consider using MongoDB Atlas environment variables in deployment platforms
