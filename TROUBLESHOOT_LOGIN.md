# Login Troubleshooting Guide

## Problem: "Hindi ako makapaglogin" (Cannot login)

**Error: POST http://localhost:3001/api/auth/callback/credentials 401 (Unauthorized)**

Based on the code analysis, here are the common causes and solutions:

---

## 1. Quick Checklist

Before proceeding, ensure you have done these steps in order:

- [ ] **Restart the dev server** completely (Ctrl+C, then `npm run dev`)
- [ ] **Clear browser cookies** for localhost (open DevTools → Application → Cookies → delete all localhost cookies)
- [ ] **Check the terminal** for auth logs (look for `[Auth]` messages)

---

## 2. Check Environment Variables (.env.local)

Make sure `.env.local` has these required variables:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ilovedentist
NEXTAUTH_SECRET=<any-32-character-random-string>
NEXTAUTH_URL=http://localhost:3001
```

**Important:** Replace the port number (3001) with whatever port your dev server is actually running on!

**How to check your port:** Look at the terminal when you run `npm run dev` - it will say something like:
```
ready - started server on http://localhost:3001
```

---

## 3. Seed the Database

The demo users must be created first:

```bash
npm run seed
```

Expected output:
```
✅ Branches created
✅ Users created
✅ Dentist profile created
✅ Patients created
```

**If you see "MONGODB_URI not set":** Your `.env.local` file is not properly configured.

---

## 4. Verify Users Exist in Database

Run a test to check if users were created:

```bash
node test-login.js
```

Or check MongoDB Atlas → Collections → users → you should see 3 documents.

---

## 5. Test Login Credentials

After seeding, use these credentials **exactly** (case-sensitive):

| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Admin   | admin@ilovedentist.com       | Admin1234!    |
| Staff   | staff@ilovedentist.com       | Staff1234!    |
| Dentist | dentist@ilovedentist.com     | Dentist1234!  |

---

## 6. Check Server Logs

When you try to login, check the terminal for these messages:

- `[Auth] User not found:` → User doesn't exist in database (run `npm run seed`)
- `[Auth] Invalid password for:` → Wrong password
- `[Auth] User inactive:` → Account is disabled
- `[Auth] Login successful:` → Login works! Check browser cookie issues

---

## 7. Common Issues & Fixes

### Issue: 401 Unauthorized
- Run `npm run seed` to create users
- Check terminal logs for the specific reason

### Issue: Cookies not being set
- Clear browser cookies
- Make sure you're not in incognito mode with cookies blocked
- Check browser console for cookie errors

### Issue: "Database connection error"
- Check MongoDB Atlas - ensure IP whitelist includes your IP
- Verify `MONGODB_URI` in `.env.local` is correct

### Issue: Wrong port
- Make sure `NEXTAUTH_URL` matches the port in your terminal
- Example: if terminal says `localhost:3001`, use `NEXTAUTH_URL=http://localhost:3001`

---

## Quick Setup Commands

```bash
# 1. Stop the server (Ctrl+C)

# 2. Check your .env.local has correct values
# (Cannot read .env files, but you know what you set)

# 3. Run the seed script
npm run seed

# 4. Start the server on the correct port
npm run dev
```

Then open http://localhost:3000/login (or your actual port) and use:
- **admin@ilovedentist.com** / **Admin1234!**

---

## Updated Auth Configuration (v1.1)

The auth system now includes:
- ✅ Dynamic port detection for localhost
- ✅ Detailed logging for debugging
- ✅ Better error handling
- ✅ Support for different ports (3000, 3001, etc.)

