# Project Camp Backend

A REST API backend for a collaborative project management system.

## Features

- JWT authentication with access/refresh tokens
- Email verification and password reset flow
- Role-based project permissions
- Project and member management
- Tasks and subtasks
- Task file attachments
- Project notes
- Health check endpoint

## Stack

Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Multer, Nodemailer

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the example with:

```powershell
Copy-Item .env.example .env
```

Set `MONGO_URI` and JWT secrets in `.env` before starting the API.

## Production

The app listens on `process.env.PORT` and uses `MONGO_URI`, so it can be deployed to a Node.js hosting service. Set every required environment variable in the hosting provider instead of committing `.env`.

## Main endpoints

- `GET /api/v1/healthcheck/`
- `/api/v1/auth/*`
- `/api/v1/projects/*`
- `/api/v1/tasks/*`
- `/api/v1/notes/*`
