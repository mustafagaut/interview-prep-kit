# Interview Prep Kit

Generate a personalized interview kit from a job description and company URL.

## Architecture

- `client/`: Next.js App Router and Tailwind CSS interface.
- `server/`: Express, TypeScript, Mongoose, crawler, generation pipeline, and API routes.
- `scripts/evaluate.js`: Batch evaluator for Appendix B output.
- **Database**: MongoDB stores generated kits, question builder state, and practice confidence scores.

The platform also includes deterministic readiness scoring, pressure simulations, resume evidence analysis, STAR stories, blind-spot detection, Interview Day, architecture/coding labs, knowledge notes, exports, persisted simulation memory, events, and feature flags.

## Authentication

The application uses JWT-based authentication:

- **Registration**: Create an account with email and password (minimum 8 characters)
- **Login**: Receive a JWT token valid for 7 days
- **Protected Routes**: All kit-related API endpoints require authentication
- **Token Management**: Tokens are stored in localStorage and automatically included in API requests
- **Auto-Redirect**: Unauthorized requests redirect to the login page

## Security Features

- Password hashing with bcrypt (10 rounds)
- ObjectId validation to prevent injection attacks
- Connection pooling and proper MongoDB connection management
- User data isolation (users can only access their own kits)
- JWT token expiration and validation

---

## Pipeline

1. **Crawl**: Fetch the company URL with `robots.txt` checks, timeouts, retries, HTML sanitization, and ranked careers/about/jobs links.
2. **Research**: Search public sources for interview culture.
3. **Extract**: Extract stable requirements as `r1`, `r2`, and classify as `must` versus `nice`.
4. **Questions**: Generate categorized questions as `q1`, `q2`, and run a deterministic two-pass coverage loop.
5. **Schedule**: Generate flashcards as `f1`, `f2` and allocate the schedule arithmetically across 1–60 days.

> **Note:** When `OPENAI_API_KEY` is configured, the pipeline uses structured OpenAI-compatible generation with retries for rate limits and server errors. Without a key, it falls back to a deterministic generator.

---

## Builder and Practice Mode

* **Question Builder**: Supports inline question edits, custom questions, deletion, reordering, pinning, and isolated category regeneration. Regeneration preserves edited, custom, and pinned questions.
* **Practice Mode**: Supports animated flashcard flipping, 1–3 confidence ratings, and weakest-first sorting. Confidence values are persisted with the kit.

---

## API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | Liveness check |
| `/ready` | `GET` | MongoDB readiness check |
| `/api/auth/register` | `POST` | Register a new user account |
| `/api/auth/login` | `POST` | Login and receive JWT token |
| `/api/auth/logout` | `POST` | Logout (client-side token management) |
| `/api/auth/me` | `GET` | Get current user info |
| `/api/kits` | `GET` \| `POST` | List kits or generate/persist a new kit |
| `/api/kits/:id` | `GET` \| `PUT` | Retrieve a kit or persist builder/practice edits |
| `/api/kits/:id/regenerate` | `POST` | Regenerate one question category |
| `/api/kits/:id/reschedule` | `POST` | Recalculate the deterministic schedule |
| `/api/kits/:id/readiness` | `GET` | Explainable readiness dimensions and weak topics |
| `/api/kits/:id/progress` | `GET` | Practice progress and readiness summary |
| `/api/kits/:id/pressure-session` | `POST` | Start a pressure simulation |
| `/api/kits/:id/resume-analysis` | `GET` \| `POST` | Analyze resume claims and evidence risk |
| `/api/kits/:id/stories` | `GET` \| `POST` | List or create STAR stories |
| `/api/kits/:id/stories/:storyId` | `PUT` \| `DELETE` | Update or remove a story |
| `/api/kits/:id/blind-spots` | `GET` | List under-practiced JD topics |
| `/api/kits/:id/daily-weakness` | `GET` | Select one daily weakness plan |
| `/api/kits/:id/interview-day` | `GET` | Generate a focused interview-day plan |
| `/api/kits/:id/debrief` | `POST` | Persist a post-interview debrief |
| `/api/kits/:id/labs/architecture` | `POST` | Create or evaluate an architecture lab |
| `/api/kits/:id/labs/coding` | `POST` | Create or evaluate a coding lab |
| `/api/kits/:id/export` | `GET` | Export kit data (`?format=json\|markdown\|csv`) |
| `/api/kits/:id/knowledge` | `GET` \| `POST` | List or save skill-linked notes |
| `/api/kits/:id/knowledge/:noteId` | `DELETE` | Remove a knowledge note |
| `/api/kits/:id/events` | `GET` \| `POST` | Read or record kit events |
| `/api/kits/features` | `GET` | Inspect enabled feature flags |

**Note**: All `/api/kits/*` endpoints require authentication via JWT token in the `Authorization: Bearer <token>` header.

---

## Setup

### 1. Install Dependencies

```powershell
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Configure Environment Variables

Copy the example environment file and configure it with your values:

```powershell
cp .env.example .env
```

Required environment variables:

- **MONGODB_URI**: MongoDB connection string (e.g., `mongodb://localhost:27017/interview-prep-kit`)
- **JWT_SECRET**: Secret key for JWT token signing (use a strong random string in production)
- **PORT**: Server port (default: 4000)
- **NEXT_PUBLIC_API_URL**: Client-side API URL (default: `http://localhost:4000`)
- **API_SERVER_URL**: Server-side API URL for Next.js rewrites (default: `http://localhost:4000`)

### 3. Start MongoDB

Ensure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB instance.

### 4. Start the Development Servers

```powershell
# Start the backend server
npm run dev:server

# Start the frontend client (in a separate terminal)
npm run dev:client
```

The backend will run on `http://localhost:4000` and the frontend on `http://localhost:3000`.

### 5. Build for Production

```powershell
# Build the backend
npm run build:server

# Build the frontend
npm run build:client

# Start production servers
npm run start:server
npm run start:client
```

## Testing

Run the test suite:

```powershell
npm test
```

Tests cover MongoDB persistence, service logic, and API functionality.