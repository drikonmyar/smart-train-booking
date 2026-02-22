# Smart Train Booking

Full-stack train booking platform with role-based modules for users and admins.

## Live Deployment

| Component | Tech | Platform | URL |
|---|---|---|---|
| Frontend | React + Vite | Vercel | https://smart-train-booking-vercel.vercel.app |
| Backend API | Java 21 + Spring Boot | Render | https://smart-train-booking.onrender.com |
| Database | PostgreSQL | Render | Managed through backend datasource config |

Operational dashboards:
- Render: https://dashboard.render.com/project/prj-d6d2svffte5s73d4mlmg
- Vercel: https://vercel.com/jgecsongs1-2172s-projects/smart-train-booking-vercel

## Core Features

### User Features
- Register and login
- Search trains by source, destination, and date
- Station autocomplete with keyboard navigation
- Book tickets with seat validation
- View and filter booking history
- Cancellation lock rule near departure window

### Admin Features
- Station management (create, update, search with date filters)
- Train management (create, update, status, running days, search, pagination)
- Booking management and filters
- Role-gated admin pages and admin API checks

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router, Vite, Bootstrap |
| Backend | Spring Boot 4, Spring Data JPA, Hibernate |
| Database | PostgreSQL |
| Build/Runtime | Maven, Java 21, Docker |
| Deploy | Render (API + DB), Vercel (UI) |

## Repository Structure

```text
smart-train-booking/
├── backend/        # Spring Boot API
└── frontend/       # React + Vite web app
```

## API Overview

### Auth
- `POST /api/users/register`
- `POST /api/users/login`

### Trains
- `POST /api/trains/search`
- `POST /api/trains/create` (general create)

### Admin Trains (requires admin role header)
- `GET /api/admin/trains`
- `GET /api/admin/trains/{id}`
- `POST /api/admin/trains`
- `PUT /api/admin/trains/{id}`
- `PATCH /api/admin/trains/{id}/status`

### Stations
- `GET /api/stations/search`
- `POST /api/stations/create` (admin)
- `PUT /api/stations/{id}` (admin)

### Bookings
- `POST /api/bookings/create`
- `GET /api/bookings/user/{userId}`
- `POST /api/bookings/{bookingId}/cancel`
- `POST /api/bookings/getall` (admin)

## Role Model (Current)

- UI stores logged-in user in browser local storage.
- Admin APIs are protected using request header:
  - `X-User-Role: ADMIN`
- This is a lightweight role check model (not JWT-based).

## Local Development Setup

## 1. Prerequisites
- Java 21
- Maven 3.9+
- Node.js 18+ (recommended 20+)
- PostgreSQL

## 2. Backend

From project root:

```bash
cd backend
```

Set environment variables:

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/smart_train_booking"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="postgres"
```

Run:

```bash
mvn spring-boot:run
```

Backend default local URL:
- `http://localhost:8080`

## 3. Frontend

From project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend local URL:
- `http://localhost:5173`

Note:
- In local dev, Vite proxies `/api` to `http://localhost:8080`.

## Environment Variables

### Backend (required in deployment)
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

### Backend (optional)
- `PORT` (Render injects this automatically; app uses `${PORT:8080}`)

### Frontend
- No mandatory frontend env var currently.
- API routing is handled through `frontend/vercel.json` rewrites.

## Deployment Notes

## Backend on Render (Docker)
- Root directory: `backend`
- Dockerfile path: `backend/Dockerfile`
- Required env vars: datasource URL, username, password
- Docker image uses Java 21

## Frontend on Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Keep `frontend/vercel.json` to:
  - Rewrite `/api/*` to Render backend
  - Rewrite SPA routes to `/index.html`

## Useful Commands

Backend:

```bash
cd backend
mvn -DskipTests clean package
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### Vercel shows 404
- Confirm Vercel project root is `frontend`.
- Ensure `frontend/vercel.json` is present.
- Redeploy with cleared build cache.

### Backend fails with Java release error
- Use Java 21 locally and in Docker image.
