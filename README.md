# Node SQL Play - User CRUD

This repo contains a basic Node.js + MSSQL backend and a React TypeScript frontend.

## Prerequisites

- SQL Server reachable from the machine running the backend.
- Windows authentication enabled for the Node process.
- Microsoft ODBC Driver 17/18 installed (required by `msnodesqlv8`).

## Backend (Express + MSSQL)

1. Copy the environment template:

   ```
   cd backend
   copy .env.example .env
   ```

2. Edit `.env` with your SQL Server settings (Windows auth).

   Example:
   ```
   PORT=3015
   DB_SERVER=localhost
   DB_INSTANCE=
   DB_DATABASE=NodeSqlPlay
   CORS_ORIGIN=http://localhost:5173
   ```
3. Install dependencies and run:

   ```
   npm install
   npm run dev
   ```

The API runs at `http://localhost:3015/api`.

### Endpoints

- `GET /api/health`
- `POST /api/admin/create-db`
- `GET /api/admin/db-exists`
- `POST /api/admin/create-learning-platform`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## Frontend (React + Vite)

1. Copy the environment template:

   ```
   cd frontend
   copy .env.example .env
   ```

2. Install dependencies and run:

   ```
   npm install
   npm run dev
   ```

The app runs at `http://localhost:5015`.

### Dev proxy

The Vite dev server proxies `/api` to `http://localhost:3015`, so the frontend can
use `/api` without CORS issues. You can override the base URL in `.env` via
`VITE_API_BASE`.

## Notes

- Use the **Create Database** button in the UI (or call the admin endpoint) to create the database and `Users` table if they do not exist.
- SQL Server Windows authentication is required for the Node process running the backend.
