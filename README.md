# Task API — CI/CD Pipeline Demo

A simple Express.js Task API used to demonstrate a complete, free CI/CD pipeline:

**GitHub → GitHub Actions (test → build → scan) → Docker Hub → Render (auto-deploy) → Discord notification**

Live demo: _add your Render URL here once deployed_

## Architecture

```
 Push to GitHub
       │
       ▼
 GitHub Actions
   1. Install deps + run Jest tests
   2. Build Docker image
   3. Scan image with Trivy (fails on HIGH/CRITICAL vulnerabilities)
   4. Push image to Docker Hub (tagged :latest and :<commit-sha>)
   5. Trigger Render deploy hook
   6. Post success/failure to Discord
       │
       ▼
 Render (free tier) pulls the new image and redeploys automatically
       │
       ▼
 Live public URL
```

## Tech stack
- Node.js + Express
- Jest + Supertest (tests)
- Docker
- GitHub Actions (CI/CD)
- Trivy (container vulnerability scanning)
- Docker Hub (image registry)
- Render (hosting, free tier)
- Discord webhook (deploy notifications)

## API Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create a task `{ "title": "string" }` |
| PUT | `/tasks/:id` | Update a task `{ "title"?, "done"? }` |
| DELETE | `/tasks/:id` | Delete a task |

## Run locally
```bash
npm install
npm run dev        # starts on http://localhost:3000
```

## Run tests
```bash
npm test
```

## Run with Docker
```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## Full setup guide (from zero)
See `SETUP_GUIDE.md` for the complete step-by-step walkthrough — from creating the GitHub repo to getting a live auto-deploying URL.
