# 🔑 Quick Reference: Your Environment Variables

## Copy these to your .env.local file:

```env
# Google OAuth Configuration (for NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=oWYEuvaWT3cZyEdCBc5U0U/Vx2695kPtEvmd2lrx6W4=
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_FROM_GOOGLE_CONSOLE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_FROM_GOOGLE_CONSOLE
```

## ✅ What's Done:

- ✅ NEXTAUTH_SECRET has been generated for you (shown above)
- ✅ NEXTAUTH_URL is set to localhost:3000

## ⏳ What You Need to Do:

1. **Get Google Credentials:**

   - Go to: https://console.cloud.google.com/
   - Follow the steps in `GOOGLE_AUTH_SETUP.md`
   - Copy your `GOOGLE_CLIENT_ID`
   - Copy your `GOOGLE_CLIENT_SECRET`

2. **Update .env.local:**

   - Replace `YOUR_CLIENT_ID_FROM_GOOGLE_CONSOLE` with your actual Client ID
   - Replace `YOUR_CLIENT_SECRET_FROM_GOOGLE_CONSOLE` with your actual Client Secret

3. **Restart Dev Server:**

   ```bash
   npm run dev
   ```

4. **Test:**
   - Open http://localhost:3000
   - Click "Sign in with Google" button
   - Login and verify it works!

## 📝 Important URLs for Google Console:

**Authorized JavaScript origins:**

```
http://localhost:3000
```

**Authorized redirect URIs:**

```
http://localhost:3000/api/auth/callback/google
```

---

**Need detailed instructions?** See `GOOGLE_AUTH_SETUP.md` for complete step-by-step guide.
