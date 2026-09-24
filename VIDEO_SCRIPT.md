# Interview Prep Kit - Project Video Script

Target length: 10-12 minutes

Style: calm, confident, product demonstration

## Before Recording

Prepare:

- MongoDB running locally or a MongoDB Atlas connection string.
- `server/.env` containing `MONGODB_URI`.
- OpenAI key optional. The project works with the deterministic fallback.
- Two terminals available.

Start the application:

```powershell
npm run dev:server
npm run dev:client
```

Open:

```text
http://localhost:3000
```

Use a prepared job description for a Senior MERN Stack Developer and a public company URL.

## 1. Opening - 0:00-0:40

### On screen

Show the Interview Prep Kit home page.

### Say

"This is Interview Prep Kit, an AI-powered interview preparation system built for candidates who want more than a flat list of generated questions.

The system understands the job description, researches the company, creates a balanced preparation plan, tracks practice confidence, identifies weaknesses, and continuously recommends what the candidate should do next.

The goal is to connect the candidate, the job, the requirements, the questions, the practice results, and the next recommendation in one preparation loop."

## 2. What The Product Does - 0:40-1:20

### On screen

Point to the home page and the form.

### Say

"The workflow starts with three pieces of context: the job description, the company URL, and the amount of preparation time available.

From that input, the backend creates requirements with stable IDs such as r1 and r2, separates must-have requirements from nice-to-have requirements, researches the company, and generates a complete interview kit.

The output includes questions, flashcards, a schedule, company research, readiness signals, and adaptive practice tools."

## 3. Create A Kit - 1:20-2:10

### On screen

1. Paste the Senior MERN Stack Developer job description.
2. Enter the company URL.
3. Enter the company name and role title if needed.
4. Set preparation days to 5.
5. Click `Generate interview kit`.

### Say

"I am using a Senior MERN Stack Developer role as the example.

The job description contains technologies such as React, Node.js, Express, MongoDB, Redis, APIs, WebSockets, Docker, AWS, security, testing, and performance.

When I submit this form, the Express backend starts the generation pipeline. Company crawling respects robots.txt, uses timeouts and retries, removes unsafe HTML elements, and prioritizes useful internal pages such as careers, jobs, about, and engineering pages.

If an OpenAI-compatible API key is configured, structured AI generation is available. If no key is configured, the deterministic generator keeps the product usable."

## 4. Mission Control Home - 2:10-2:50

### On screen

After the kit is created, return to the home page or refresh it.

Show the Mission Control panel.

Point to:

- Target role.
- Company.
- Readiness score.
- Top risks.
- Next Best Action.
- Start next best practice button.

### Say

"The home screen becomes Mission Control after a kit exists.

It shows the current target role, the company, the explainable readiness score, the highest-risk topics, and one recommended next action.

This recommendation is deterministic. For example, if Redis has low confidence and thin question coverage, the system recommends fixing that blind spot instead of randomly suggesting another question.

The candidate can start the next best practice directly from this panel."

## 5. Kit Header And Navigation - 2:50-3:20

### On screen

Open the generated kit detail page.

Show the header and tabs:

- Brief
- Questions
- Flashcards
- Schedule
- Pressure
- Resume
- Stories
- Blind-Spots
- Interview-Day
- Debrief
- Labs
- Knowledge

### Say

"The kit detail page is organized around preparation workflows rather than disconnected pages.

The navigation keeps the original kit experience intact while adding progressive modules for readiness, simulation, evidence, stories, labs, and learning resources.

The tab bar remains horizontally usable on smaller screens, and the Mission Control panel can be hidden if the candidate wants a more focused workspace."

## 6. Brief And Readiness Radar - 3:20-4:05

### On screen

1. Click `Brief`.
2. Show the readiness radar.
3. Expand two or three score factors.
4. Show weak-topic badges.

### Say

"The Brief tab contains the company summary and the Interview Readiness Radar.

The radar is not a mysterious AI score. Each dimension is calculated from stored signals.

The dimensions include technical depth, job-description coverage, company knowledge, behavioral readiness, system-design readiness, weak-topic confidence, communication, and practical coding readiness.

For example, a score can be explained by the number of relevant questions, the number practiced, the average confidence from one to three, and the number of weak concepts detected.

The weak-topic section tells the candidate why a score is low and what needs attention."

## 7. Question Bank - 4:05-5:15

### On screen

1. Click `Questions`.
2. Show the category regeneration controls.
3. Show the custom question form.
4. Edit a question prompt.
5. Edit the answer outline.
6. Pin a question.
7. Move a question up or down.
8. Delete a question.

### Say

"The Question Bank is generated from the actual job requirements.

Category allocation is explicit. For a 20-question kit, the default distribution is ten technical questions, four system-design questions, three behavioral questions, and three company-fit questions.

This prevents company-fit questions from dominating and guarantees that system design is present for senior and full-stack roles.

The generator validates total count, category balance, duplicates, requirement links, and system-design coverage. If a category fails validation, only that category is regenerated.

The builder is fully editable. I can edit a prompt, edit an answer outline, pin a question, reorder it, add a custom question, or delete it.

These states are persisted, and isolated regeneration preserves edited, custom, and pinned questions."

## 8. Schedule - 5:15-5:45

### On screen

1. Click `Schedule`.
2. Show the day cards.
3. Click a schedule day.
4. Show the Questions tab filtered to that day.

### Say

"The schedule is deterministic. Questions are distributed across one to sixty days using difficulty and must-have priority.

Each day receives integer minutes based on question difficulty.

The schedule cards are interactive. Clicking a day takes me directly to the questions assigned to that day, and I can return to the complete question bank with Show all questions."

## 9. Flashcards And Weakness Detection - 5:45-6:35

### On screen

1. Click `Flashcards`.
2. Flip a card.
3. Rate it one, two, or three stars.
4. Click `Sort by Weakest First`.
5. Open `Blind-Spots`.

### Say

"Flashcards turn the question bank into active recall practice.

The candidate flips a card, rates confidence from one to three stars, and can sort the deck weakest first.

Those confidence values feed the readiness radar, blind-spot detector, and Next Best Action engine.

Blind Spots identify requirements that matter to the job but have thin question coverage or low practice confidence.

One Weakness a Day selects one high-impact topic and gives the candidate a short explanation, targeted flashcards, targeted questions, a practical scenario, and a follow-up question."

## 10. Pressure Mode - 6:35-7:35

### On screen

1. Click `Pressure`.
2. Select `Hard` or `Technical`.
3. Select `Senior Staff Engineer` or `System Design Expert`.
4. Start the session.
5. Answer a prompt.
6. Click `Submit & next probe`.

### Say

"Pressure Mode simulates an interviewer who progressively probes the candidate.

The candidate can choose a pressure level from warm-up to stress and select an interviewer personality such as Friendly Engineer, Senior Staff Engineer, Startup CTO, Skeptical Reviewer, or System Design Expert.

The questions are connected to the generated requirements. Follow-ups ask why, go deeper into implementation, test trade-offs, introduce failure modes, challenge contradictions, and add practical scenarios.

Answers are stored in an Interview Session. The interviewer memory records supported candidate claims, weaknesses, and unfinished topics so the session can build continuity instead of acting like unrelated flashcards.

Stress mode is challenging but explicitly non-abusive."

## 11. Resume Cross-Examination - 7:35-8:15

### On screen

1. Click `Resume`.
2. Paste a resume excerpt.
3. Click `Analyze resume`.
4. Show a high-risk claim.
5. Show suggested evidence and follow-up question.

### Say

"Resume Cross-Examination analyzes only claims the candidate actually provides.

It extracts technologies, projects, responsibilities, experience, and measurable achievements.

A claim such as Improved API performance by 70 percent is marked high risk because an interviewer may ask how that number was measured.

The system suggests evidence to prepare: the baseline, measurement window, sample size, and the candidate's direct contribution.

Unsupported facts are not invented. If the resume does not support a claim, the system reports that evidence is needed."

## 12. Story Bank - 8:15-8:50

### On screen

1. Click `Stories`.
2. Create a production incident story.
3. Fill Situation, Task, Action, and Result.
4. Leave Result incomplete briefly.
5. Show the missing-component warning.
6. Complete the story.

### Say

"The Story Bank helps the candidate prepare behavioral evidence using STAR.

Stories are organized by categories such as leadership, conflict, failure, difficult bugs, production incidents, performance improvements, ownership, teamwork, learning, deadlines, and customer issues.

The system checks whether Situation, Task, Action, and Result are present. If Result is missing, the candidate sees a concrete warning instead of a vague score.

Each story also receives realistic follow-up prompts about measurable results, trade-offs, and what the candidate would change today."

## 13. Interview Day And Debrief - 8:50-9:35

### On screen

1. Open `Interview-Day`.
2. Show top five questions.
3. Show weakest flashcards.
4. Show introduction and company summary.
5. Open `Debrief`.
6. Enter remembered questions and unanswered topics.
7. Save the debrief.

### Say

"Interview Day is a minimal final-review mode. It compresses preparation into the most important questions, weakest flashcards, a candidate introduction, company context, stories, and questions to ask the interviewer.

After the interview, Debrief captures what actually happened: remembered questions, unanswered topics, interviewer feedback, confidence, and outcome.

The system compares the actual interview with the kit's predicted topics and creates a next-focus list for the next practice cycle."

## 14. Architecture And Coding Labs - 9:35-10:20

### On screen

1. Click `Labs`.
2. Create an Architecture Lab prompt.
3. Submit a written architecture approach.
4. Show criterion-level evaluation.
5. Switch to Coding Lab.
6. Show the criteria.

### Say

"The Labs tab turns preparation into applied practice.

Architecture Lab evaluation looks for requirements and assumptions, API design, data modeling, scaling, failure handling, security, and observability.

Coding Lab evaluation looks for correctness, tests, edge cases, security, and complexity.

The evaluator does not execute candidate code in the API process. It gives deterministic, explainable feedback about the submitted approach."

## 15. Knowledge Base And Exports - 10:20-10:55

### On screen

1. Click `Knowledge`.
2. Add a Redis or MongoDB note.
3. Add skills.
4. Show Markdown, CSV, and JSON export buttons.
5. Delete the note.

### Say

"The Knowledge Base connects notes, documentation, articles, and cheatsheets to the skills in the kit.

This keeps learning material close to the questions and weaknesses it supports.

The complete kit can be exported as JSON, Markdown, or CSV. Notes can be removed at any time."

## 16. Technical Architecture - 10:55-11:35

### On screen

Show the repository structure or README:

- Next.js client.
- Express TypeScript server.
- Mongoose and MongoDB.
- Cheerio/Axios crawler.
- Deterministic services.
- OpenAI-compatible adapter.
- Docker Compose.
- Node test suite.

### Say

"The frontend uses Next.js App Router and Tailwind CSS.

The backend uses Express, TypeScript, and Mongoose.

The crawler handles robots.txt, timeouts, retries, ranked internal links, and sanitized text extraction.

The generation pipeline combines optional structured AI generation with deterministic validation and fallback behavior.

The application has separate services for readiness, pressure sessions, resume analysis, stories, weaknesses, labs, exports, feature flags, and session memory.

The system is tested with Node's test runner and can be built with Docker Compose."

## 17. Reliability And Safety - 11:35-12:00

### On screen

Show the terminal commands and test output:

```powershell
npm test --prefix server
npm run build:server
npm run build:client
```

### Say

"The product is designed to degrade gracefully.

Without an API key, deterministic generation still works.

Company claims must come from retrieved sources. Candidate claims must come from the resume or user input. Generated questions are labeled as generated.

The server has liveness and MongoDB readiness checks, centralized API errors, request validation, retry handling, and graceful shutdown.

Feature flags allow experimental modules to be disabled server-side."

## 18. Closing - 12:00-12:30

### On screen

Return to the Mission Control home screen.

### Say

"Interview Prep Kit is not just a question generator.

It connects the candidate, the job, the company, the requirements, the questions, the evidence, the confidence data, the weaknesses, the simulations, and the debrief.

Every interaction improves the next recommendation.

The result is a practical Interview Intelligence OS that tells the candidate what to practice, why it matters, how to improve, and what to do next.

Thank you for watching."

## Optional Short Demo Closing

"In one sentence: Interview Prep Kit turns a job description into an adaptive preparation system that understands what the candidate knows, what they can defend, and what they should practice next."