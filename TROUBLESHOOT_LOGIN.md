# Login Troubleshooting Guide

## Problem: "Hindi ako makapaglogin" (Cannot login)

Based on the code analysis, here are the common causes and solutions:

---

## 1. Check Environment Variables (.env.local)

Make sure `.env.local` has these required variables:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ilovedentist
NEXTAUTH_SECRET=<any-32-character-random-string>
NEXTAUTH_URL=http://localhost:3000
```

**How to check:**
- Look at `.env.example` for the template
- Create/edit `.env.local` with your MongoDB connection string

---

## 2. Seed the Database

The demo users (admin, staff, dentist) must be created first:

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

---

## 3. Verify MongoDB Connection

- Ensure your MongoDB Atlas cluster is accessible
- Check that the IP whitelist includes your current IP
- Verify username/password in connection string

---

## 4. Test Login Credentials

After seeding, use these credentials:

| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Admin   | admin@ilovedentist.com       | Admin1234!    |
| Staff   | staff@ilovedentist.com       | Staff1234!    |
| Dentist | dentist@ilovedentist.com     | Dentist1234!  |

---

## 5. Check for Errors

Run the dev server and check browser console:
```bash
npm run dev
```

Common error messages:
- "Invalid email or password" → User doesn't exist or wrong password
- "Database connection error" → MongoDB not accessible
- "Token error" → NEXTAUTH_SECRET missing

---

## 6. If Still Not Working

Try these additional steps:

1. **Restart the dev server** (Ctrl+C, then `npm run dev`)
2. **Clear browser cache/cookies** related to localhost
3. **Check MongoDB Atlas** - ensure database `ilovedentist` exists

---

## Quick Setup Commands

```bash
# 1. Copy example env
copy .env.example .env.local

# 2. Edit .env.local with your MongoDB URI
# (Get free tier at mongodb.com/cloud/atlas)

# 3. Seed database
npm run seed

# 4. Run app
npm run dev
```

Then open http://localhost:3000/login and use the demo credentials above.

