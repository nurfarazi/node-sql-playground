# Node SQL Play - User CRUD

This repo contains a basic Node.js + MSSQL backend and a React TypeScript frontend.

## Backend (Express + MSSQL)

1. Copy the environment template:

   ```
   cd backend
   copy .env.example .env
   ```

2. Edit `.env` with your SQL Server settings (Windows auth).
3. Install dependencies and run:

   ```
   npm install
   npm run dev
   ```

The API runs at `http://localhost:3001/api`.

### Endpoints

- `GET /api/health`
- `POST /api/admin/create-db`
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

The app runs at `http://localhost:5173`.

## Notes

- Use the **Create Database** button in the UI (or call the admin endpoint) to create the database and `Users` table if they do not exist.
- SQL Server Windows authentication is required for the Node process running the backend.
