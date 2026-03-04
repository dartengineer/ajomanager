# Ajo Manager — Frontend

React dashboard for managing Ajo savings circles.

## Stack
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **State**: Zustand (auth) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Toasts**: Sonner

## Quick Start

```bash
npm install
npm run dev    # → http://localhost:3000
```

Ensure the backend is running on `http://localhost:5000`.
Vite proxies `/api/*` to the backend automatically.

## Pages

| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Overview + stats |
| `/groups` | All groups list |
| `/groups/new` | Create group |
| `/groups/:id` | Group detail + members + payments |
| `/payments` | Payment history |
| `/members` | All members across groups |
| `/notifications` | Email notification log |
| `/settings` | Profile + password |

## Key Features

- **Live pot calculator** — shows total pot as you type on group creation
- **Member payment tracker** — who paid, who hasn't, per cycle
- **Mid-cycle joiner display** — shows adjustment owed clearly
- **One-click reminders** — send email reminder from member row
- **Cycle advancement** — marks collector and resets payment flags
- **Turn shuffler** — randomise order before group starts
- **Progress bars** — visual cycle progress per group

## Project Structure
```
src/
├── components/
│   ├── ui/          # Button, Input, Card, Modal, Avatar...
│   └── layout/      # Sidebar, AppLayout, ProtectedRoute
├── pages/           # One file per route
├── services/        # api.js — all Axios calls
├── store/           # authStore.js (Zustand)
└── utils/           # helpers.js — formatters, colours
```
