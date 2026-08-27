# Javedan-X

### A full-stack social networking application

A Twitter/X-inspired social platform built with React, Node.js, Express, PostgreSQL, and Prisma.

Users can create posts, follow other users, interact with posts, manage their profiles, and authenticate through local or OAuth authentication.

---

## Overview

Javedan-X is a full-stack social networking application developed as part of The Odin Project.

The application includes authentication, user management, follow relationships, posts, comments, likes, profile management, account security, and a production-oriented backend architecture.

The backend is designed as a RESTful API with a clear separation between routes, controllers, services, validation, authentication, and database access.

The frontend provides a responsive social-media interface built with React and Tailwind CSS.

---

## Live Demo

**Application:**  
https://javedancode.github.io/Javedan-X/

A demo account is available directly from the login page.

The demo account is pre-populated with posts, follows, likes, and comments so the application can be explored without creating an account.

---

## Features

### Authentication

- Local email/password authentication
- Google OAuth authentication
- GitHub OAuth authentication
- Email verification
- Password reset flow
- Secure HTTP-only authentication cookies
- Short-lived access tokens
- Refresh token rotation
- Server-side session management
- Session revocation
- Protected application routes
- Logout and session cleanup

### Users & Profiles

- User registration
- User profiles
- Custom display names
- Custom biographies
- Profile pictures
- Username changes
- Email address changes with verification
- Password changes
- Account deletion
- Automatic handling of local and OAuth accounts

### Follow System

- Send follow requests
- Accept follow requests
- Decline follow requests
- Cancel pending requests
- Unfollow users
- View followers and following
- View sent and received requests
- Follow state reflected throughout the application

### Posts

- Create text posts
- Edit your own posts
- Delete your own posts
- View posts from followed users
- View your own posts
- Display post authors, likes, and comments

### Likes & Comments

- Like and unlike posts
- Display like counts
- Track the current user's likes
- Create comments
- Display comments and timestamps
- Delete your own comments
- Navigate to commenter profiles

### Discovery

- Browse registered users
- Search users
- Follow users directly from discovery
- Navigate to user profiles
- Clickable avatars and usernames throughout the application

### Profile Privacy

- User posts are restricted until the viewer follows the user
- Your own profile remains fully accessible
- Follow relationships determine access to another user's posts

### Demo Experience

The database includes seeded demo data consisting of:

- A dedicated demo account
- Additional users
- Posts
- Comments
- Likes
- Follow relationships
- Pending follow requests

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express
- Passport.js
- JWT
- Zod
- bcrypt
- Helmet
- CORS
- Compression
- Morgan

### Database

- PostgreSQL
- Prisma ORM

### Testing

- Vitest
- Supertest

### Deployment

- GitHub Pages for the frontend
- Production hosting provider for the backend
- GitHub Actions for frontend deployment

---

## Architecture

The project is split into two applications:

```text
Javedan-X/
├── client/
└── server/
```

### Frontend

The React application is responsible for:

- User interface
- Client-side routing
- Authentication state
- API communication
- Forms and validation feedback
- Post interactions
- Follow interactions
- Profile management

### Backend

The Express application provides the REST API and handles:

- Authentication
- Authorization
- Session management
- User management
- Follow relationships
- Posts
- Likes
- Comments
- Validation
- Error handling
- Database access

The backend follows a layered architecture:

```text
Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL
```

This keeps HTTP concerns separate from application logic and database operations.

---

## Database Models

The PostgreSQL database contains the following primary models:

```text
User
 ├── Account
 ├── Session
 ├── VerificationToken
 ├── Post
 ├── Comment
 ├── Like
 └── Follow

Post
 ├── Comment
 └── Like

Follow
 ├── Requester
 └── Recipient
```

Authentication providers:

```text
LOCAL
GOOGLE
GITHUB
```

Follow statuses:

```text
PENDING
ACCEPTED
DECLINED
```

---

## Authentication Architecture

Authentication uses Passport.js, JWTs, and database-backed sessions.

After successful authentication:

1. The user is authenticated through Passport.
2. A database session is created.
3. An access token is issued.
4. A refresh token is issued.
5. Authentication tokens are stored in HTTP-only cookies.
6. Refresh tokens are rotated when refreshed.
7. Sessions can be revoked independently or globally.

This provides a more complete authentication system than storing a JWT alone on the client.

---

## API

The backend exposes RESTful endpoints organized around application resources.

Main resource groups include:

```text
/auth
/users
/posts
/follows
/comments
/likes
```

Examples:

```text
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

GET    /users
GET    /users/:userId
GET    /users/:userId/posts

PATCH  /users/me
PATCH  /users/me/password
PATCH  /users/me/username
PATCH  /users/me/email
DELETE /users/me

POST   /follows/users/:recipientId/follow
PATCH  /follows/:followId/accept
PATCH  /follows/:followId/decline
DELETE /follows/:followId/request
DELETE /follows/:followId

POST   /posts
PATCH  /posts/:postId
DELETE /posts/:postId
```

The complete API implementation can be found in `server/src`.

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/JavedanCode/Javedan-X.git
cd Javedan-X
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

---

## Environment Variables

Create a `.env` file inside `server/`.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

PORT=3000

CLIENT_ORIGIN="http://localhost:5173"

ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

EMAIL_ENABLED=false

RESEND_API_KEY=""
EMAIL_FROM=""
```

The exact variables depend on the authentication and email configuration being used.

Never commit production secrets to the repository.

---

## Database Setup

From the `server` directory, generate the Prisma client:

```bash
npm run db:generate
```

Run the database migrations:

```bash
npm run db:migrate
```

Populate the database with demo data:

```bash
npx prisma db seed
```

The seed script creates users, posts, comments, likes, and follow relationships for the demo environment.

---

## Running the Backend

From `server`:

```bash
npm run dev
```

The API will start using the configured port.

A health check is available at:

```text
GET /health
```

---

## Running the Frontend

From `client`:

```bash
npm run dev
```

Vite will provide the local development URL.

---

## Testing

The backend test suite uses Vitest and Supertest.

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run linting:

```bash
npm run lint
```

Run formatting checks:

```bash
npm run format:check
```

Run the complete verification suite:

```bash
npm run check
```

---

## Deployment

The frontend is deployed to GitHub Pages using GitHub Actions.

The deployment workflow:

1. Checks out the repository
2. Installs frontend dependencies
3. Builds the Vite application
4. Configures the GitHub Pages SPA fallback
5. Uploads the production build
6. Deploys the application to GitHub Pages

The production frontend is available at:

```text
https://javedancode.github.io/Javedan-X/
```

The backend is deployed separately and is configured through the frontend's `VITE_API_URL` environment variable.

---

## Project Structure

```text
Javedan-X/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── errors/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── tests/
│   ├── package.json
│   └── prisma.config.ts
│
└── .github/
    └── workflows/
        └── deploy-pages.yml
```

---

## Design Goals

### Separation of concerns

Controllers handle HTTP requests and responses while services contain application logic.

### Reusability

The authentication and user-management portions of the backend were designed as a reusable foundation for future applications.

### Security

Authentication credentials, sessions, passwords, and account-management operations are handled on the server rather than trusting the client.

### Validation

Incoming request data is validated before reaching application logic.

### Maintainability

The codebase is organized around clear responsibilities instead of placing application logic directly inside route handlers.

### Production-oriented development

The application includes security middleware, structured errors, session management, database constraints, testing, environment configuration, and automated deployment.

---

## Future Improvements

Possible future additions include:

- Image and media posts
- Image uploads
- Real-time notifications
- Real-time messaging
- Post pagination
- Infinite scrolling
- More advanced user search
- Notification system
- Profile banners
- Post sharing/reposting
- Content moderation
- Improved mobile navigation

These features are intentionally outside the current scope of the application.

---

## License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

## Author

**Soren Javedan**

Full-Stack Developer · Backend Engineer

GitHub:  
https://github.com/JavedanCode
