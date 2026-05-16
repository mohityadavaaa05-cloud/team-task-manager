# ⚡ TeamFlow — Team Task Manager

A full-stack task management web app with role-based access control (Admin/Member).

## 🚀 Features

- **Authentication** — Signup/Login with JWT tokens, bcrypt password hashing
- **Role-based Access** — Admin (create projects, manage members) vs Member
- **Project Management** — Create, update, delete projects with color coding and deadlines
- **Task Board** — Kanban-style board with 4 columns: To Do → In Progress → Review → Done
- **Task Management** — Create, assign, update, delete tasks with priority, due dates, and tags
- **Dashboard** — Overview of assigned tasks, overdue alerts, project progress
- **Team Management** — Add/remove members per project with role assignments

## 🛠 Tech Stack

**Backend:** Node.js + Express + MongoDB (Mongoose) + JWT  
**Frontend:** React 18 + Vite + React Router v6

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── models/          # User, Project, Task schemas
│   ├── routes/          # auth, projects, tasks, users
│   ├── middleware/       # JWT auth, role checks
│   ├── server.js         # Express entry point
│   └── .env.example      # Environment variables template
└── frontend/
    └── src/
        ├── pages/        # LoginPage, SignupPage, Dashboard, Projects, ProjectDetail
        ├── components/   # Layout (sidebar)
        ├── context/      # AuthContext
        └── utils/        # api.js (axios), helpers.js
```

## ⚡ Local Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd team-task-manager

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173

## 🌐 Deployment on Railway

### Backend

1. Push code to GitHub
2. Create a new Railway project
3. Add service → "Deploy from GitHub repo" → select `/backend` folder
4. Add environment variables:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — any strong random string
   - `CLIENT_URL` — your frontend Railway URL
5. Railway auto-detects Node.js and deploys

### Frontend

1. Add another Railway service → select `/frontend` folder
2. Set build command: `npm run build`
3. Set start command: `npx serve dist`
4. Add environment variable:
   - `VITE_API_URL` — your backend Railway URL (e.g. `https://teamflow-backend.railway.app/api`)

> **Note:** Update `frontend/src/utils/api.js` to use `import.meta.env.VITE_API_URL` as the baseURL for production.

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (owner) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (owner) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project=:id` | Get project tasks |
| GET | `/api/tasks/my` | Get my tasks |
| GET | `/api/tasks/overdue` | Get overdue tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## 📊 Data Models

### User
- name, email, password (hashed), role (admin/member)

### Project
- name, description, owner (ref: User), members [{user, role}], status, deadline, color

### Task
- title, description, project (ref), assignedTo (ref: User), createdBy (ref: User), status (todo/in-progress/review/done), priority (low/medium/high/urgent), dueDate, tags

## 🔒 Role-Based Access

| Action | Member | Admin | Owner |
|--------|--------|-------|-------|
| View project | ✅ | ✅ | ✅ |
| Create task | ✅ | ✅ | ✅ |
| Edit task | ✅ | ✅ | ✅ |
| Delete task | Own only | ✅ | ✅ |
| Add members | ❌ | ✅ | ✅ |
| Remove members | ❌ | ❌ | ✅ |
| Delete project | ❌ | ❌ | ✅ |
