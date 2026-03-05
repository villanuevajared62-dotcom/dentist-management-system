# 🦷 ILoveDentist Clinic — Appointment Management System

A full-stack, production-ready appointment management system built with **Next.js 14**, **MongoDB**, **Tailwind CSS**, and **NextAuth**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ilovedentist
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
4. Deploy!

---

## 🔑 Demo Login Credentials (after seeding)

| Role    | Email                          | Password       |
|---------|-------------------------------|----------------|
| Admin   | admin@ilovedentist.com         | Admin1234!     |
| Staff   | staff@ilovedentist.com         | Staff1234!     |
| Dentist | dentist@ilovedentist.com       | Dentist1234!   |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # All REST API routes
│   │   ├── auth/               # NextAuth handler
│   │   ├── appointments/       # CRUD + available slots
│   │   ├── branches/           # Branch management
│   │   ├── dentists/           # Dentist profiles
│   │   ├── patients/           # Patient records
│   │   └── users/              # Account management
│   ├── dashboard/              # Protected dashboard pages
│   │   ├── appointments/       # List, create, edit, view
│   │   ├── patients/           # List, register, edit, view
│   │   ├── branches/           # Admin: branch CRUD
│   │   ├── dentists/           # Admin: dentist profiles
│   │   ├── accounts/           # Admin: staff accounts
│   │   └── schedule/           # Dentist: weekly schedule
│   ├── login/                  # Login page
│   └── providers.tsx           # Session + React Query
├── components/
│   └── layout/
│       └── Sidebar.tsx         # Role-aware navigation
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── api-helpers.ts          # Auth middleware + response helpers
│   ├── db.ts                   # MongoDB connection singleton
│   ├── utils.ts                # Time slots, formatting, cn()
│   ├── validations.ts          # Zod schemas (shared client+server)
│   └── seed.ts                 # Database seed script
├── models/
│   ├── User.ts                 # User (with bcrypt)
│   ├── Branch.ts
│   ├── Dentist.ts              # Links User + Branch + schedule
│   ├── Patient.ts
│   └── Appointment.ts          # With double-booking prevention
├── middleware.ts               # Route protection by role
└── types/
    └── index.ts                # Shared TypeScript types
```

---

## 👥 Role Permissions

| Feature                    | Admin | Staff | Dentist |
|----------------------------|:-----:|:-----:|:-------:|
| View appointments          | ✅    | ✅    | ✅ (own)|
| Create appointment         | ✅    | ✅    | ❌      |
| Edit/cancel appointment    | ✅    | ✅    | ❌      |
| Update treatment notes     | ✅    | ❌    | ✅      |
| Register patients          | ✅    | ✅    | ❌      |
| View patients              | ✅    | ✅    | ✅      |
| Manage branches            | ✅    | ❌    | ❌      |
| Manage dentist profiles    | ✅    | ❌    | ❌      |
| Manage user accounts       | ✅    | ❌    | ❌      |
| View weekly schedule       | ✅    | ✅    | ✅      |

---

## 🔒 Key Technical Details

### Double-Booking Prevention
`POST /api/appointments` checks for overlapping appointments before creating:
```ts
const conflict = await Appointment.findOne({
  dentistId, date,
  status: { $in: ['Pending', 'Completed'] },
  $or: [
    { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
    { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
    { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
  ],
});
```

### Available Time Slots
`GET /api/appointments/slots?dentistId=...&date=...`
- Reads dentist's weekly schedule
- Generates 30-minute slots within working hours
- Removes already-booked slots
- Returns only available times

### Authentication
- NextAuth with JWT strategy (no DB session table)
- Passwords hashed with bcrypt (12 rounds)
- Role + id stored in JWT, exposed via `session.user`
- Middleware protects `/dashboard/*`, `/admin/*`, etc.

### Validation
- Zod schemas in `src/lib/validations.ts`
- Applied on **both** client-side forms and server-side API routes
- API returns structured error messages

---

## 🗄️ Database Collections

| Collection    | Description                           |
|---------------|---------------------------------------|
| `users`       | Login accounts with hashed passwords  |
| `branches`    | Clinic locations                      |
| `dentists`    | Dentist profiles with schedules       |
| `patients`    | Patient records and medical history   |
| `appointments`| Bookings with status tracking         |

---

## 📦 Dependencies

- **next** 14 — App Router, Server Components
- **mongoose** — MongoDB ODM
- **next-auth** — Authentication (JWT)
- **bcryptjs** — Password hashing
- **zod** — Schema validation
- **date-fns** — Date utilities
- **@tanstack/react-query** — Data fetching & caching
- **tailwindcss** — Styling
- **lucide-react** — Icons
- **react-hot-toast** — Notifications
