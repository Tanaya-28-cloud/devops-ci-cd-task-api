# Full Setup Guide — Zero to Live CI/CD Pipeline

Follow this in order. Every step is something you type or click — nothing assumed.

---

## Prerequisites (install once)
- [Node.js](https://nodejs.org) (LTS version) — check with `node -v`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — check with `docker -v`
- [Git](https://git-scm.com/) — check with `git -v`
- A GitHub account
- A Docker Hub account (free — [hub.docker.com](https://hub.docker.com))
- A Render account (free — [render.com](https://render.com), sign up with GitHub for easiest setup)
- A Discord account (free, for deploy notifications) — or use Slack instead if you prefer

---

## Day 1 — Get the app running locally, then in Docker

### 1. Get the project files
If Claude generated the files for you, download and unzip them into a folder, e.g. `task-api/`.

### 2. Install dependencies and run locally
```bash
cd task-api
npm install
npm run dev
```
Open `http://localhost:3000/health` in your browser — you should see `{"status":"ok",...}`.

Try the API with curl:
```bash
curl http://localhost:3000/tasks
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"My first task"}'
```

### 3. Run the tests
```bash
npm test
```
All 6 tests should pass. This matters — if tests fail locally, they'll fail in CI too.

### 4. Build and run with Docker
```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```
Visit `http://localhost:3000/health` again — same result, but now it's running inside a container.

**Understand what just happened:** Docker read your `Dockerfile`, built a small Linux image with Node and your code baked in, and ran it as an isolated process. This exact image is what will eventually run on Render.

### 5. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Task API with tests and Dockerfile"
```
Create a **new public repository** on GitHub (public = free unlimited Actions minutes). Then:
```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint:** app runs locally, runs in Docker, and code is on GitHub.

---

## Day 2 — Understand and trigger the CI part of the pipeline

The workflow file is already at `.github/workflows/ci-cd.yml`. It has 4 jobs: `test`, `build-and-scan`, `push`, `deploy`. Today you only care about the first two — they don't need any secrets yet.

### 1. Push and watch it run
Since you already pushed in Day 1, go to your GitHub repo → **Actions** tab. You'll see a run. Click it.

It will likely **fail** at the `push` or `deploy` job right now — that's expected, because you haven't added secrets yet (Day 3–4 fixes that). The `test` and `build-and-scan` jobs should pass.

### 2. Break it on purpose (learn what a failing pipeline looks like)
Edit a test in `tests/app.test.js` so it's wrong on purpose, e.g. change `expect(res.statusCode).toBe(200)` to `toBe(999)`. Commit and push:
```bash
git add .
git commit -m "test: intentionally break a test to see CI fail"
git push
```
Watch the Actions tab — the `test` job should fail with a red X. Now revert your change, commit, push again, and watch it go green.

**Why this matters for interviews:** you can say "I verified the pipeline actually catches failures, not just that it runs."

✅ **Checkpoint:** you understand how to read GitHub Actions logs and that failing tests block the pipeline.

---

## Day 3 — Docker Hub + vulnerability scanning

### 1. Create a Docker Hub access token
Docker Hub → your avatar → **Account Settings** → **Security** → **New Access Token**. Give it a name like `github-actions`, copy the token (you won't see it again).

### 2. Add GitHub Secrets
In your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:
| Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | the access token you just created |

### 3. Push again and watch the `push` job
```bash
git commit --allow-empty -m "ci: trigger pipeline after adding Docker Hub secrets"
git push
```
Go to Actions — the `build-and-scan` job runs **Trivy**, a free open-source scanner that checks your image for known vulnerabilities (CVEs) in the OS packages and dependencies. If it finds HIGH/CRITICAL issues, the job fails and shows a table of what's wrong (this is intentional — it's a real DevSecOps gate).

If it fails here, it's usually because the base image (`node:20-alpine`) has a known CVE — check the Trivy output, and if needed, bump the version tag in your `Dockerfile` (e.g. `node:20.17-alpine`) and push again.

Once the scan passes, the `push` job logs in to Docker Hub and pushes your image. Check Docker Hub — you should see a new repository with `latest` and a commit-SHA tag.

✅ **Checkpoint:** every clean push produces a scanned, versioned image in Docker Hub.

---

## Day 4 — Continuous Deployment to Render

### 1. Create a Render Web Service
Render dashboard → **New** → **Web Service** → connect your GitHub repo.
- **Environment**: Docker (Render will detect your `Dockerfile` automatically)
- **Instance type**: Free
- Leave build/start commands blank (Docker handles it)
- Click **Create Web Service** — Render will do an initial build/deploy from your repo directly. Let it finish once.

### 2. Get the Deploy Hook URL
In your new service → **Settings** → scroll to **Deploy Hook** → copy the URL. This is a private URL that, when POSTed to, tells Render "redeploy now."

### 3. Add it as a GitHub Secret
Same place as before (repo → Settings → Secrets → Actions):
| Name | Value |
|---|---|
| `RENDER_DEPLOY_HOOK` | the deploy hook URL |

### 4. Push and watch full pipeline run
```bash
git commit --allow-empty -m "ci: trigger full pipeline with Render deploy"
git push
```
Now all jobs should run: test → build-and-scan → push → deploy. The `deploy` job just does a `curl -X POST` to your Render hook, which tells Render to pull the latest and redeploy.

### 5. Visit your live URL
Render gives you a URL like `https://task-api-xxxx.onrender.com`. Visit `/health` and `/tasks` — this is now live on the internet, redeployed automatically every time you push to `main`.

> Free tier note: Render's free web services "sleep" after inactivity and take ~30–60 seconds to wake on the first request. This is normal — mention it in your README so reviewers aren't confused by a slow first load.

✅ **Checkpoint:** you have a public, auto-deploying URL. This is your single best portfolio asset — put it in your resume/LinkedIn.

---

## Day 5 — Notifications, docs, and polish

### 1. Set up a Discord webhook (2 minutes)
Discord → your server → channel settings → **Integrations** → **Webhooks** → **New Webhook** → copy the URL.

Add it as a GitHub Secret:
| Name | Value |
|---|---|
| `DISCORD_WEBHOOK_URL` | the webhook URL |

Push again — you should get a Discord message when the deploy succeeds (or fails).

*(Prefer Slack? Slack has an equivalent "Incoming Webhooks" app — the `curl` step in the workflow is identical, just swap the URL and Slack's JSON payload shape (`{"text": "..."}` instead of `{"content": "..."}`).)*

### 2. Add a branch protection rule (optional but impressive)
Repo → Settings → Branches → Add rule for `main` → require the `test` and `build-and-scan` checks to pass before merging. This shows you understand safe merge practices, not just "it works on my machine."

### 3. Fill in the README
- Add your live Render URL at the top
- Add 2–3 screenshots: a green Actions run, the Trivy scan output, the Discord notification
- Add the architecture diagram (already sketched in README.md — turn it into a simple image with [Excalidraw](https://excalidraw.com) or [draw.io](https://draw.io) if you want it to look nicer)

### 4. Record a short demo
Screen-record ~60–90 seconds: edit code → `git push` → show the Actions tab running → show the live site updating. Upload to Loom or YouTube (unlisted) and link it in the README. This single video does more for your job applications than paragraphs of explanation — recruiters can watch it in a minute.

✅ **Final checkpoint:** public repo, green pipeline, live auto-deploying app, documented architecture, demo video. Ready to link on your resume and talk through in interviews.

---

## Talking points for interviews
Be ready to explain, in your own words:
- Why you split the pipeline into separate jobs (`test`, `build-and-scan`, `push`, `deploy`) instead of one long script
- What Trivy is scanning and why you'd fail a build on HIGH/CRITICAL CVEs
- Why the Dockerfile copies `package*.json` before the rest of the code (layer caching)
- Why the deploy job only runs on `main`, not on pull requests
- What you'd add next if this were a real production system (e.g. staging environment, rollback strategy, real database instead of in-memory storage, secrets manager instead of GitHub Secrets)
