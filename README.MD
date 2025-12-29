# Research Collaboration Platform

A web-based platform designed to facilitate collaboration among professors, students, and researchers. This platform allows users to create and manage research projects, post updates, apply to projects, and communicate through real-time chat and comments.

## Features

- **User Management**: Sign up and authentication with Clerk (email/password, social logins)
- **Project Creation**: Professors can create and manage research projects
- **Updates Posting**: Project members can post rich-text updates related to their projects
- **Application System**: Students can apply to join projects with status tracking
- **Real-time Chat**: Socket.io-based project channels for team communication
- **Comments**: Users can comment on updates and applications
- **Search Functionality**: Search projects by title, department, creation year
- **Role-Based Access Control**: STUDENT, PROFESSOR, and ADMIN roles with permissions
- **Caching**: Redis caching for improved performance (1-hour TTL for lists)
- **GraphQL API**: Efficient data querying and manipulation

## Technologies Used

### Backend
- **Runtime**: Node.js v18
- **API**: GraphQL (Apollo Server v4.11.0)
- **Database**: MongoDB v6.9.0
- **Caching**: Redis v4.7.0
- **Real-time**: Socket.io v4.8.1
- **Authentication**: Clerk Backend SDK v1.15.9

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.10
- **State Management**: Apollo Client v3.11.10
- **Router**: React Router DOM v6.28.0
- **Authentication**: Clerk React v5.18.0
- **UI**: Bootstrap 5.3.3
- **Rich Text Editor**: React Draft WYSIWYG

### Infrastructure
- **Containerization**: Docker (Node 18-alpine)
- **Package Manager**: pnpm 9.14.2

---

## Getting Started

### Prerequisites

Ensure you have the following:

- **Node.js** v18 or later
- **pnpm** (or npm)
- **MongoDB Atlas Account** (free tier available at https://cloud.mongodb.com)
- **Redis Stack Server** (running locally)
- **Clerk Account** (for authentication, free tier at https://clerk.com)

---

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/CS-554-Team-Cool-Kids/research-collaboration-platform.git
cd research-collaboration-platform
```

#### 2. Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Get your **Publishable Key** (starts with `pk_test_...`)
4. Get your **Secret Key** (starts with `sk_test_...`)
5. Configure user metadata in Clerk:
   - Go to **User & Authentication** → **Metadata**
   - Add custom public metadata fields:
     - `role` (String): STUDENT | PROFESSOR | ADMIN
     - `department` (String): One of the 10 engineering departments

#### 3. Set Up MongoDB Atlas

1. Go to https://cloud.mongodb.com and sign in (or create free account)
2. Create a new cluster (free M0 tier is fine)
3. Wait for cluster to be created (~3-5 minutes)
4. Click "Connect" on your cluster
5. Add your current IP address to the IP whitelist (or use `0.0.0.0/0` for testing - allow from anywhere)
6. Create a database user with username and password
7. Click "Choose a connection method" → "Connect your application"
8. Select "Driver: Node.js" and "Version: 5.5 or later"
9. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/...`)
10. Replace `<password>` with your database user password

#### 4. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# MongoDB Atlas Configuration
# Paste your connection string from MongoDB Atlas here
mongoServerUrl=mongodb+srv://username:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
mongoDbname=research_collaboration_db

# Redis Configuration
redis_ip=127.0.0.1
redis_port=6379

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_actual_clerk_secret_key

# Environment
NODE_ENV=development
```

**Frontend** (`frontend/.env`):

```bash
# Copy the example file
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```env
# Clerk Authentication (Publishable Key - safe for browser)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_clerk_publishable_key

# GraphQL API Configuration
VITE_GRAPHQL_IP=localhost
VITE_GRAPHQL_PORT=4000

# Socket.io Configuration
VITE_SOCKET_IP=localhost
VITE_SOCKET_PORT=4001
```

**IMPORTANT**: Never commit `.env` files to version control. Only `.env.example` files are tracked.

#### 5. Start Redis Server

```bash
redis-stack-server
```

Redis will run on port **6379**.

#### 6. Install Dependencies and Seed Database

```bash
cd backend
pnpm install  # or npm install
pnpm run seed # Seed the database with test data
pnpm start    # Start the Apollo Server
```

Backend services:
- **Apollo GraphQL Server**: http://localhost:4000
- **Socket.io Server**: http://localhost:4001

#### 7. Start the Frontend

```bash
cd frontend
pnpm install  # or npm install
pnpm run dev  # Start Vite dev server
```

Frontend runs on **http://localhost:8080**

---

## Usage

### First-Time Setup

1. **Sign Up**: Navigate to http://localhost:8080 and click "Sign Up"
2. **Create Account**: Use Clerk's sign-up form (email/password or social login)
3. **Set Role & Department** (Optional):
   - By default, new users get role `STUDENT` and department `COMPUTER_SCIENCE`
   - To change: Go to Clerk Dashboard → Users → Select user → Public metadata
   - Add/edit:
     ```json
     {
       "role": "PROFESSOR",
       "department": "ELECTRICAL_AND_COMPUTER_ENGINEERING"
     }
     ```
4. **First Login**: The app will automatically create your MongoDB user record on first authenticated request

### Testing with Seed Data

The seed script creates 20 professors and 20 students with realistic data. To test:

1. **Create Clerk accounts** for test users matching seeded emails (or update seeded data to match your Clerk users)
2. **Set metadata** in Clerk Dashboard to match seeded roles
3. Alternatively, just sign up new users and they'll be added to the database automatically

### Role-Based Features

**STUDENT:**
- Browse and search projects
- Apply to projects
- View application status
- Comment on updates and applications
- Chat in project channels

**PROFESSOR:**
- All student features
- Create and manage projects
- Post project updates
- Review and approve/reject applications
- Manage team members

**ADMIN:**
- All professor features
- Full access to all operations

---

## Ports

| Service              | Port   |
| -------------------- | ------ |
| **React App**        | `8080` |
| **Apollo Server**    | `4000` |
| **Socket.io Server** | `4001` |
| **Redis Server**     | `6379` |
| **MongoDB Atlas**    | Cloud (via connection string) |

---

## Architecture

### Authentication Flow

1. User signs in via Clerk (frontend)
2. Clerk issues JWT token
3. Apollo Client attaches token to every GraphQL request (Authorization header)
4. Backend verifies token with Clerk SDK
5. Backend fetches/creates user in MongoDB
6. User data attached to GraphQL context
7. Resolvers enforce role-based authorization

### Database Schema

- **users**: User profiles (no passwords, Clerk handles auth)
- **projects**: Research projects with teams
- **updates**: Project announcements and progress reports
- **applications**: Student applications to projects
- **comments**: Comments on updates and applications
- **messages**: Real-time chat messages per project channel

### Caching Strategy

- **List queries**: 1-hour TTL in Redis
- **Single resource queries**: No expiration
- **Cache invalidation**: Manual on mutations

### Real-time Features

- Socket.io for project-based chat channels
- Last 50 messages loaded on join
- Real-time message broadcasting

---

## API Documentation

### GraphQL Endpoint

- URL: http://localhost:4000
- Playground: http://localhost:4000 (in development mode)

### Key Queries

- `me`: Get currently authenticated user
- `projects`: List all projects (cached)
- `getProjectById(id)`: Get project details
- `searchProjectByTitle(searchTerm)`: Search projects

### Key Mutations

- `login(token)`: Bootstrap user in MongoDB (called automatically)
- `addProject(...)`: Create project (PROFESSOR/ADMIN only)
- `addApplication(...)`: Apply to project (STUDENT only)
- `changeApplicationStatus(...)`: Approve/reject (PROFESSOR/ADMIN only)
- `addUpdate(...)`: Post update (PROFESSOR/ADMIN only)
- `addComment(...)`: Comment on update/application

---

## Development

### Running in Development Mode

```bash
# Backend (with auto-reload)
cd backend
pnpm start

# Frontend (with hot reload)
cd frontend
pnpm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
pnpm run build
pnpm run preview
```

### Docker Support

Docker configuration is included (Node 18-alpine images). See `backend/Dockerfile` and `frontend/Dockerfile`.

---

## Manual Testing Checklist

### 1. Authentication
- [ ] Sign up new user
- [ ] Sign in with existing user
- [ ] Sign out via UserButton
- [ ] Verify user created in MongoDB

### 2. Projects (as Professor)
- [ ] Create new project
- [ ] View project details
- [ ] Edit project
- [ ] View team members

### 3. Applications (as Student)
- [ ] Browse all projects
- [ ] Apply to project
- [ ] View application status
- [ ] Withdraw application

### 4. Applications (as Professor)
- [ ] View project requests
- [ ] Approve application
- [ ] Reject application
- [ ] See updated team roster

### 5. Updates
- [ ] Post update (Professor)
- [ ] View newsfeed
- [ ] Comment on update

### 6. Chat
- [ ] Join project channel
- [ ] Send messages
- [ ] See messages from other users
- [ ] Verify messages persist

### 7. Authorization
- [ ] Try accessing professor routes as student → blocked
- [ ] Try creating project as student → backend rejects
- [ ] Verify backend enforces role checks

---

## Troubleshooting

### Backend won't start
- **MongoDB Atlas connection failed**:
  - Verify your connection string is correct in `backend/.env`
  - Check your IP address is whitelisted in MongoDB Atlas
  - Verify database user credentials are correct
  - Ensure cluster is active (not paused)
- Check Redis is running locally
- Verify `CLERK_SECRET_KEY` is set in `backend/.env`
- Check ports 4000 and 4001 are available

### Frontend won't start
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in `frontend/.env`
- Check port 8080 is available
- Clear browser cache if components don't load

### "Authentication failed" errors
- Verify Clerk keys are correct
- Check Clerk token hasn't expired
- Ensure backend can reach Clerk API

### User not appearing in MongoDB
- Check `login` mutation is called (happens automatically on first protected route)
- Verify MongoDB Atlas connection string is correct
- Check backend logs for errors
- Verify you can see the database in MongoDB Atlas web interface
- Check IP whitelist in MongoDB Atlas includes your current IP

### Chat messages not sending
- Verify Socket.io server is running on port 4001
- Check browser console for connection errors
- Ensure `VITE_SOCKET_IP` and `VITE_SOCKET_PORT` are correct

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

Special thanks to:
- **Team Cool Kids** (CS-554) for development
- **Clerk** for authentication infrastructure
- **Apollo GraphQL** for the excellent GraphQL server
- **MongoDB** and **Redis** for data persistence and caching

---

## Contact

For questions or issues, please open an issue on GitHub.
