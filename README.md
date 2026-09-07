# Task API — CI/CD Pipeline Project

A simple Express.js Task API built to demonstrate a complete, fully working, **cost-free CI/CD pipeline**:

**GitHub → GitHub Actions (test → build → scan → push) → Docker Hub → Render (auto-deploy) → Discord notification**

 Pipeline status: **all stages passing**
 Live demo: `<your-render-url-here>`
 Repository: `<your-github-repo-url-here>`
 Docker image: `<your-dockerhub-repo-url-here>`

---

## Overview

This project isn't just a deployed app — it's a working demonstration of a real DevOps pipeline, built from scratch:

- Automated testing on every push
- Docker image build with a **multi-stage Dockerfile** (smaller, more secure final image)
- Container vulnerability scanning with **Trivy** before anything ships
- Automated push to Docker Hub with commit-SHA tagging
- Automated deployment to Render on every merge to `main`
- Deploy status notifications sent to Discord

Everything runs on free tiers — no cloud spend, no credit card required.

---

## Architecture

```
 Developer pushes to GitHub (main branch)
              │
              ▼
      GitHub Actions pipeline
      ┌─────────────────────────────┐
      │ 1. Install deps + run tests │  (Jest + Supertest)
      │ 2. Build Docker image       │  (multi-stage build)
      │ 3. Scan image with Trivy    │  (fails on HIGH/CRITICAL CVEs)
      │ 4. Push image to Docker Hub │  (tagged :latest + :<sha>)
      │ 5. Trigger Render deploy    │  (via deploy hook)
      │ 6. Notify Discord           │  (success/failure)
      └─────────────────────────────┘
              │
              ▼
      Render pulls the new image
              │
              ▼
      Live public URL updates automatically
```

---

## Tech stack

| Layer | Tool |
|---|---|
| App | Node.js + Express |
| Testing | Jest + Supertest |
| Containerization | Docker (multi-stage build) |
| CI/CD | GitHub Actions |
| Security scanning | Trivy |
| Image registry | Docker Hub |
| Hosting | Render (free tier) |
| Notifications | Discord webhook |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get one task |
| POST | `/tasks` | Create a task — body: `{ "title": "string" }` |
| PUT | `/tasks/:id` | Update a task — body: `{ "title"?, "done"? }` |
| DELETE | `/tasks/:id` | Delete a task |

Example:
```bash
curl <your-render-url-here>/tasks
curl -X POST <your-render-url-here>/tasks -H "Content-Type: application/json" -d '{"title":"Ship the project"}'
```

---

## Run it locally

```bash
git clone <your-github-repo-url-here>
cd <repo-folder>
npm install
npm run dev        # starts on http://localhost:3000
```

Run the test suite:
```bash
npm test
```

Run it in Docker:
```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

---

## How the pipeline works

The full workflow lives in `.github/workflows/ci-cd.yml` and runs automatically on every push to `main`:

1. **Test** — installs dependencies and runs the Jest test suite. If any test fails, the pipeline stops here.
2. **Build & Scan** — builds the Docker image, then scans it with Trivy. The build fails if any HIGH or CRITICAL vulnerability is found, so nothing insecure gets shipped.
3. **Push** — logs into Docker Hub and pushes the image, tagged both `:latest` and with the commit SHA for traceability.
4. **Deploy** — calls Render's deploy hook, which pulls the new image and redeploys.
5. **Notify** — posts a success or failure message to a Discord channel, so deploy status is visible without checking GitHub.

Pull requests run steps 1–2 only (test + build/scan) — nothing is pushed or deployed until code is merged to `main`.

---

## Security notes

- The Dockerfile uses a **multi-stage build**: dependencies are installed in a build stage, and only the app code plus production `node_modules` are copied into the final image — npm itself is stripped out, since it's not needed at runtime and its bundled internal dependencies were previously flagging vulnerabilities unrelated to the app.
- The final stage runs `apk upgrade` to patch OS-level packages before shipping.
- The container runs as a non-root user (`USER node`).
- Every image is scanned with Trivy before being pushed or deployed.

---

## Notes
- Render's free tier sleeps after inactivity — the first request after idle time may take 30–60 seconds to respond. This is expected behavior, not a bug.
