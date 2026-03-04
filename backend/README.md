# Ajo Manager — Backend API

A production-ready REST API for managing Ajo (rotating savings circles) groups.

## Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens)
- **Email**: Nodemailer / Resend
- **Scheduler**: node-cron

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and email credentials
```

### 3. Seed the database (optional, for dev)
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev      # Development (with nodemon)
npm start        # Production
```

Server runs on `http://localhost:5000`

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create admin account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |
| PATCH | `/api/auth/change-password` | Change password |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create Ajo group |
| GET | `/api/groups` | List my groups |
| GET | `/api/groups/:id` | Get group details |
| PATCH | `/api/groups/:id` | Update group |
| DELETE | `/api/groups/:id` | Delete group (draft only) |
| POST | `/api/groups/:id/start` | Start group + lock turns |
| POST | `/api/groups/:id/shuffle-turns` | Randomise turn order |
| POST | `/api/groups/:id/advance-cycle` | Move to next cycle |
| GET | `/api/groups/:id/dashboard` | Get stats summary |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups/:groupId/members` | Add member |
| GET | `/api/groups/:groupId/members` | List members |
| PATCH | `/api/groups/:groupId/members/:memberId` | Update member info |
| DELETE | `/api/groups/:groupId/members/:memberId` | Remove member |
| PATCH | `/api/groups/:groupId/members/:memberId/turn` | Assign turn order |
| PATCH | `/api/groups/:groupId/members/swap-turns` | Swap two turns |
| PATCH | `/api/groups/:groupId/members/:memberId/adjustment-paid` | Mark adjustment paid |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Record a payment |
| GET | `/api/payments/group/:groupId` | All payments for group |
| GET | `/api/payments/group/:groupId/cycle/:cycle` | Cycle payment summary |
| DELETE | `/api/payments/:id` | Void a payment |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/group/:groupId` | Get notification history |
| POST | `/api/notifications/remind` | Send payment reminder |
| POST | `/api/notifications/turn-notice` | Send turn upcoming notice |

---

## Ajo Business Logic

### Turn Assignment
- Admin assigns turns manually OR shuffles randomly before starting
- Once group is started (`POST /start`), turn order is **locked**
- Turns can be swapped before start via `swap-turns`

### Mid-Cycle Joins
When a member joins after cycle 1:
```
adjustmentOwed = (joinedAtCycle - 1) × contributionAmount
```
Example: Joins at cycle 3, contribution = ₦50,000
→ Owes ₦100,000 as catch-up

### Cycle Advancement
`POST /advance-cycle`:
1. Marks current collector as `hasCollected = true`
2. Resets all `hasPaid = false` for new cycle
3. Increments `currentCycle`
4. Marks group as `completed` if all cycles done

---

## Project Structure
```
src/
├── config/         # DB connection
├── controllers/    # Request handlers
├── middleware/     # Auth, validation, error handling
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # Business logic, email, scheduler
└── utils/          # Helpers, seed script
```

---

## Environment Variables
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=http://localhost:3000
ENABLE_SCHEDULER=false   # set true to run cron jobs in dev
```
