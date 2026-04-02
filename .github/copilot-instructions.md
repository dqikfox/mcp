# Mergington High School API — Copilot Workspace Instructions

## Project Overview
FastAPI Python app that lets students view and sign up for extracurricular activities.
Lives in `src/app.py` with static frontend in `src/static/`.

## Code Conventions
- Use FastAPI idioms: `HTTPException`, path parameters, query parameters
- Keep routes RESTful: `GET /activities`, `POST /activities/{name}/signup`
- In-memory store only — no DB; data resets on restart (by design)
- Student emails must end in `@mergington.edu`
- Activity names are the dict key — treat as case-sensitive identifiers

## MCP Usage
- Use the **fetch** MCP to call the live API at `http://localhost:8000` when the server is running
- Use the **playwright** MCP to test the frontend at `http://localhost:8000/static/index.html`
- Use the **filesystem** MCP to read/write any project files
- Use the **git** MCP for staging, committing, and diffing changes
- Use the **github** MCP to inspect issues, PRs, and workflows in this repo

## Running the App
```bash
pip install fastapi uvicorn
python src/app.py
# OR
uvicorn src.app:app --reload
```
API docs: http://localhost:8000/docs

## Testing with MCP (fetch)
```
GET  http://localhost:8000/activities
POST http://localhost:8000/activities/Chess%20Club/signup?email=student@mergington.edu
```

## Security
- Validate all email inputs server-side — reject non-@mergington.edu addresses
- Prevent double sign-ups — check participant list before appending
- Cap enrolment at `max_participants`

## This Repository
- This is a GitHub Skills exercise: **Integrate MCP with Copilot**
- Steps are tracked in `.github/steps/` and driven by workflows in `.github/workflows/`
- Follow the exercise steps in order via the issue linked in README.md
