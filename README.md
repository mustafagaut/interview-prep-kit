# Interview Prep Kit

Generate a personalized interview kit from a job description and company URL.

## Project Overview

This application transforms job descriptions into comprehensive interview preparation kits through automated research, intelligent question generation, and structured practice scheduling. Users can edit, regenerate sections, and practice against their kits with confidence tracking.

## Tech Stack and Justification

**Frontend**: Next.js 16.3.5 + Tailwind CSS
- **Justification**: Next.js App Router provides modern React patterns, server components, and excellent TypeScript support. Tailwind CSS enables rapid UI development with consistent styling without writing custom CSS.

**Backend**: Node.js + Express + TypeScript
- **Justification**: Express provides a mature, well-documented framework for API development. TypeScript ensures type safety across the codebase, catching errors early in development.

**Database**: MongoDB with Mongoose
- **Justification**: MongoDB's flexible schema accommodates evolving kit structures and nested data. Mongoose provides robust validation and relationship management for our document-based data model.

**Scraping**: Axios + Cheerio
- **Justification**: Axios handles HTTP requests with retry logic and timeout management. Cheerio provides jQuery-like DOM parsing for extracting structured data from HTML.

**LLM**: OpenAI-compatible (fallback to deterministic generator)
- **Justification**: When `OPENAI_API_KEY` is configured, uses structured generation with retry logic for rate limits. Falls back to deterministic generators to ensure reliability without external dependencies.

## Architecture

### High-Level Design

The application follows a clean architecture with clear separation of concerns:

```
┌─────────────────┐
│   Frontend       │
│   (Next.js)      │
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────┐
│   Backend API   │
│   (Express)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────────┐
│ MongoDB│  │  Pipeline     │
│        │  │  Services    │
└────────┘  └──────────────┘
               │
        ┌────┴────┐
        ▼         ▼
   ┌────────┐  ┌──────────┐
   │Crawler │  │  LLM     │
   └────────┘  └──────────┘
```

### Research and Generation Sequencing

The pipeline follows a deliberate sequence rather than a single prompt:

1. **Input Validation**: Validate job description and company URL format
2. **Crawl Discovery**: Fetch company site, extract and rank links, find hiring pages
3. **Public Research**: Search for interview process discussions and company culture
4. **Requirement Extraction**: Parse job description into structured requirements (must vs nice)
5. **Question Generation**: Generate category-specific questions (technical, behavioral, system-design, company-fit)
6. **Coverage Check**: Two-pass loop to ensure all must-have requirements have questions
7. **Schedule Allocation**: Deterministic arithmetic distribution across requested days
8. **Kit Assembly**: Combine all components into the final kit structure

Each step is responsible for specific logic:
- **Crawler**: Respects robots.txt, handles timeouts, ranks links by relevance
- **Pipeline**: Orchestrates the sequence, runs coverage loops, validates structure
- **Scheduler**: Pure arithmetic - no AI involved in time allocation
- **LLM Service**: Handles structured generation with retry logic for rate limits

### State Management for Builder

The builder preserves user edits during regeneration using these flags:

- **`is_edited`**: User manually edited the question/flashcard
- **`is_custom`**: User created this item from scratch  
- **`is_pinned`**: User wants this item preserved during regeneration

**Regeneration Strategy**: When regenerating a category, we:
1. Filter out items that are `is_edited`, `is_custom`, or `is_pinned`
2. Generate new items for the remaining slots
3. Merge preserved items with newly generated items
4. Renumber to maintain stable IDs

This ensures user work is never lost during section regeneration.

### Schedule Allocation Algorithm

The schedule uses deterministic arithmetic (no AI):

1. **Normalization**: Clamp days between 1-60
2. **Prioritization**: Sort questions by:
   - Must-have requirements first
   - Higher difficulty (3→2→1) 
3. **Distribution**: Round-robin distribute across days
4. **Time Allocation**: 15 minutes per difficulty point (1=15min, 2=30min, 3=45min)
5. **Validation**: Ensure every must-have requirement appears somewhere in schedule

**Key Design Decision**: Harder, higher-priority material lands earlier - not the night before. This follows the principle of tackling challenging material when cognitive resources are highest.

### Coverage Check Loop

The system runs a two-pass coverage check:

1. **First Pass**: Generate initial question bank
2. **Coverage Analysis**: Identify must-have requirements without questions
3. **Gap Filling**: Generate questions specifically for uncovered requirements
4. **Second Pass**: Re-validate coverage
5. **Stop Condition**: Maximum 2 passes to prevent infinite loops

**Design Choice**: Limited to 2 passes to balance thoroughness with performance. Most real-world job descriptions don't require more than 2 iterations to achieve adequate coverage.

### Security Implementation

**URL Validation**:
- Rejects private/loopback addresses (localhost, 127.0.0.1, 192.168.x, 10.x, etc.)
- Only allows http/https protocols
- Validates URL format before fetching

**Content Restrictions**:
- Maximum content size: 1MB per page
- Allowed content types: text/html, text/plain, application/xhtml+xml, text/xml
- Content treated as data to process, never as instructions to follow

**Authentication Security**:
- Password hashing with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- ObjectId validation to prevent injection attacks
- User data isolation (users only access their own kits)

### Edge Case Handling

**Company URL Issues**:
- Invalid URLs: Return error message, still generate kit
- 404/Timeouts: Log warning, continue with available data
- No hiring page: Record honestly in company brief

**Thin Job Descriptions**:
- 2-line stubs: Generate minimal kit with generic requirement
- Little detail: Still produce usable kit with clear limitations

**Public Search Failures**:
- No discussion found: Not fatal, kit generation continues
- Rate limits: Exponential backoff (250ms * 2^attempt, max 5s)

**Duplicate Submissions**:
- MongoDB unique constraint on email
- Returns 409 conflict on duplicate registration

**Extreme Schedule Requests**:
- 1-day: Minimum validation, focused questions
- 60-day: Maximum validation, distributed practice

### Creative Feature: Pressure Mode

**Problem Solved**: Candidates often struggle with dynamic, unscripted interview questions where interviewers probe deeper based on answers.

**Implementation**: 
- Multiple interviewer personalities (friendly-engineer, senior-staff-engineer, startup-cto, etc.)
- Progressive difficulty levels (warm-up → stress)
- Linked follow-up questions that reference previous answers
- Simulates real interview pressure with time constraints and personality-driven questioning styles

**Design Decision**: Each personality has distinct questioning patterns - e.g., "rapid-fire-technical" asks concise implementation probes, while "skeptical-reviewer" challenges assumptions and trade-offs.

### Batch Entry Point

**Command**: `npm run batch <input-file> <output-file>`

**Input Format** (JSON array):
```json
[
  {
    "id": "case1",
    "jd": "Job description text...",
    "company_url": "https://example.com",
    "days": 5
  }
]
```

**Output Format** (JSON object keyed by id):
```json
{
  "case1": {
    "status": "ok",
    "kit": { /* full kit structure */ }
  },
  "case2": {
    "status": "failed", 
    "error": "Error message"
  }
}
```

**Key Behaviors**:
- Uses same pipeline code as UI (not parallel implementation)
- Continues after individual case failures
- Respects environment variables from .env
- Handles local company addresses (relative links)
- Completes 5 cases within 15 minutes (tested)

### Retrieval Approach and Sources

**Crawler Strategy**:
- Respects robots.txt with User-Agent "PrepKitBot/1.0"
- Ranks links by keyword matching (career/jobs = 10pts, about/team = 5pts, culture/engineering = 5pts)
- Fetches top-ranked candidate if different from homepage
- Handles relative links correctly

**Public Discussion Sources**:
- DuckDuckGo HTML search for "{company} interview process culture"
- Extracts snippets and source URLs from search results
- Supplementary data - kit generation continues if search fails

**Sources Used**:
- Company websites (with robots.txt compliance)
- DuckDuckGo search results for interview culture discussions
- No social media platforms (rate limit concerns)
- No job boards (most block automated access)

### Testing Strategy

**Automated Tests**:
- Schedule allocation: 8 tests covering edge cases, validation, priority logic
- Coverage checking: 4 tests for must-have detection, multi-requirement questions
- Structure validation: 8 tests for field presence, ID formats, value ranges
- Overall: 55 tests passing, 1 skipped (MongoDB connection test)

**Test Coverage Focus**:
- Schedule arithmetic correctness
- Coverage loop effectiveness  
- Structure validation for batch compatibility
- Deterministic behavior

### Known Limitations

1. **LLM Dependency**: Without `OPENAI_API_KEY`, falls to deterministic generators which may be less nuanced
2. **Rate Limits**: Free tiers have strict limits; pipeline handles this but may be slower
3. **Company Coverage**: Companies with no web presence get minimal company briefs
4. **Schedule Simplicity**: Uses round-robin distribution rather than spaced repetition algorithms
5. **No Job Board Integration**: Deliberate per brief to avoid automated access issues

### Key Design Decisions and Trade-offs

**Two-Pass Coverage vs More**:
- **Decision**: Maximum 2 passes for coverage checking
- **Trade-off**: Some edge cases might not achieve perfect coverage, but prevents infinite loops and keeps performance reasonable

**Deterministic Schedule vs AI Allocation**:
- **Decision**: Arithmetic-only schedule allocation
- **Trade-off**: Less adaptive than AI, but predictable and testable. Ensures requirements are met consistently.

**Retry Strategy**:
- **Decision**: Exponential backoff with 3 attempts, max 5s delay
- **Trade-off**: More resilient to transient failures, but slower in worst cases

**State Preservation Strategy**:
- **Decision**: Three boolean flags (edited, custom, pinned)
- **Trade-off**: Simple implementation, but requires explicit user actions to protect content

**Crawler Depth**:
- **Decision**: Single additional page beyond homepage
- **Trade-off**: Less comprehensive than deep crawling, but faster and more respectful of server resources

---

## Architecture

- `client/`: Next.js App Router and Tailwind CSS interface.
- `server/`: Express, TypeScript, Mongoose, crawler, generation pipeline, and API routes.
- `scripts/evaluate.js`: Batch evaluator for Appendix B output.
- `scripts/batch.js`: Batch entry point for processing multiple job descriptions.
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

Tests cover MongoDB persistence, service logic, and API functionality. Key test areas:
- Schedule allocation arithmetic and validation
- Coverage checking loop effectiveness  
- Structure validation for batch compatibility
- Deterministic behavior verification

**Current Test Results**: 55 tests passing, 1 skipped (MongoDB connection test)

---

## Creative Feature: Pressure Mode

**Problem Solved**: Candidates often struggle with dynamic, unscripted interview questions where interviewers probe deeper based on answers.

**Implementation**: 
- Multiple interviewer personalities (friendly-engineer, senior-staff-engineer, startup-cto, big-tech-interviewer, skeptical-reviewer, system-design-expert, hr-manager, rapid-fire-technical)
- Progressive difficulty levels (warm-up, normal, technical, hard, stress)
- Linked follow-up questions that reference previous answers
- Simulates real interview pressure with time constraints and personality-driven questioning styles

**Design Decision**: Each personality has distinct questioning patterns - e.g., "rapid-fire-technical" asks concise implementation probes, while "skeptical-reviewer" challenges assumptions and trade-offs. The mode tracks claims, contradictions, and unfinished topics across the session to provide realistic pressure while remaining educational.