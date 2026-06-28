# 🚀 Aura: Complete Setup & Integration Guide

**Aura** is an AI-powered passive candidate validation engine that replaces traditional resumes with "Proof-of-Skill" scores based on GitHub and portfolio analysis.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Database Schema](#database-schema)
6. [Backend API](#backend-api)
7. [AI Agent Integration](#ai-agent-integration)
8. [Frontend Integration](#frontend-integration)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 📊 Project Overview

### What is Aura?

Aura automates technical candidate screening by:
- **Ingesting** candidate GitHub profiles
- **Analyzing** code quality, architecture, and relevance
- **Evaluating** against job descriptions using AI
- **Ranking** candidates by "Proof-of-Skill" score

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                        │
│            (Dashboard + Login + Candidate Rankings)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                          │
│     (Scan endpoint, Status polling, Candidate listing)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
      ┌────────────────┼────────────────┐
      ↓                ↓                ↓
┌──────────────┐ ┌───────────────┐ ┌────────────┐
│ GitHub API   │ │ LangChain AI   │ │ Supabase   │
│ (Code fetch) │ │ (Evaluation)   │ │ (Storage)  │
└──────────────┘ └───────────────┘ └────────────┘
                      ↓
                 Google Gemini
                (Free tier LLM)
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **Icons**: Lucide React
- **Authentication**: Supabase Auth (Email & Password)
- **HTTP Client**: @supabase/ssr

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **HTTP Client**: httpx (async)
- **Database**: Supabase (PostgreSQL with pgvector)
- **Cache**: Redis
- **Task Queue**: FastAPI BackgroundTasks (MVP) or Celery (production)

### AI / LLM
- **Framework**: LangChain (LCEL)
- **LLM Provider**: Google Gemini (free tier)
- **Structured Output**: Pydantic V2
- **Parsing**: JSON mode

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Vector Store**: pgvector extension
- **Cache**: Redis
- **Secrets**: .env file

---

## 📦 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** (for frontend)
- **Python 3.11+** (for backend)
- **Git** (for cloning)
- **PostgreSQL** 14+ (via Supabase)

### Free Accounts Needed

1. **Supabase** → https://supabase.com (Free tier available)
2. **Google Gemini API** → https://aistudio.google.com (No credit card)
3. **GitHub** (optional) → For higher API rate limits

---

## 🚀 Installation & Setup

### Step 1: Clone & Setup Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/aura.git
cd aura

# Create and activate Python virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env` with your actual values:

```bash
# 1. Google Gemini (Free tier LLM)
GOOGLE_API_KEY=your-key-from-aistudio.google.com

# 2. Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# 3. Redis (Local for development)
REDIS_URL=redis://localhost:6379

# 4. GitHub API (Optional, for higher rate limits)
GITHUB_API_TOKEN=your-github-token
```

**How to get each key:**

#### Google Gemini API Key
1. Go to https://aistudio.google.com
2. Click **"Get API Key"** → **"Create API Key in new project"**
3. Copy and paste into `.env`
4. Free tier: 60 requests per minute

#### Supabase
1. Go to https://supabase.com, sign up
2. Create a new project
3. Go to **Settings** → **API Keys**
4. Copy `anon (public)` and `service_role (secret)` keys
5. Find project URL in **Settings** → **General**

#### Redis (Development)
```bash
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt-get install redis-server
redis-server

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Step 3: Database Setup

```bash
# Connect to Supabase
# Go to SQL Editor in Supabase dashboard

# Run the schema migration
# Copy contents of scripts/001_init_schema.sql and execute

# Or via CLI:
supabase db push
```

The schema creates:
- `users` table (recruiters)
- `candidates` table
- `evaluations` table (with pgvector for code embeddings)
- Row Level Security policies

### Step 4: Start Backend

```bash
# In terminal 1
python main.py

# Should output:
# ✅ Redis connected
# ✅ HTTP client initialized
# Uvicorn running on http://127.0.0.1:8000
```

Test the API:
```bash
curl http://localhost:8000/health
# {"status": "ok", "redis": "connected"}
```

### Step 5: Start Frontend

```bash
# In terminal 2, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## 🗄️ Database Schema

### Tables & RLS Policies

#### 1. `users` (Recruiters)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Recruiters can only see their own row
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING ((SELECT auth.uid()) = id);
```

#### 2. `candidates` (Job Applicants)
```sql
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  github_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: All authenticated recruiters can view candidates
CREATE POLICY "candidates_select_auth" ON public.candidates
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);
```

#### 3. `evaluations` (AI Evaluations with Vector Embeddings)
```sql
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id),
  recruiter_id UUID NOT NULL REFERENCES public.users(id),
  skill_score INT CHECK (skill_score BETWEEN 0 AND 100),
  summary JSONB,
  code_embedding vector(1536),  -- pgvector for semantic search
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B-tree index for RLS performance
CREATE INDEX idx_evaluations_recruiter_id ON public.evaluations (recruiter_id);

-- RLS: Recruiters only see their own evaluations
CREATE POLICY "evaluations_select_own" ON public.evaluations
  FOR SELECT USING ((SELECT auth.uid()) = recruiter_id);
```

### Enable pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🔌 Backend API

### Endpoints

#### 1. **POST /api/v1/scan** - Start Candidate Evaluation

**Request:**
```json
{
  "candidate_id": "c-elena",
  "github_url": "https://github.com/elenavasquez",
  "job_description_id": "jd-frontend-1"
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "created_at": "2026-06-19T10:30:00Z"
}
```

**Notes:**
- Returns immediately with `task_id`
- Evaluation happens asynchronously in background
- Use `task_id` to poll status

#### 2. **GET /api/v1/scan/status/{task_id}** - Poll Evaluation Status

**Request:**
```bash
curl http://localhost:8000/api/v1/scan/status/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "evaluating",
  "candidate_id": "c-elena",
  "progress": "Running AI evaluation...",
  "skill_score": null,
  "summary": null,
  "error": null
}
```

**Status values:**
- `pending` → Waiting to start
- `fetching` → Downloading GitHub repos
- `evaluating` → AI analysis in progress
- `rate_limited` → Hit API rate limit, will retry
- `completed` → Done! `skill_score` & `summary` populated
- `failed` → Error occurred

#### 3. **GET /api/v1/candidates** - List Ranked Candidates

**Request:**
```bash
curl "http://localhost:8000/api/v1/candidates?role_id=frontend-developer&query=react"
```

**Response:**
```json
[
  {
    "id": "c-elena",
    "name": "Elena Vasquez",
    "github_url": "https://github.com/elenavasquez",
    "skill_score": 94,
    "status": "completed",
    "created_at": "2026-06-15T10:22:00Z"
  },
  {
    "id": "c-marcus",
    "name": "Marcus Lee",
    "github_url": "https://github.com/marcuslee",
    "skill_score": 81,
    "status": "completed",
    "created_at": "2026-06-15T09:05:00Z"
  }
]
```

**Query Parameters:**
- `role_id` (required) → Job role filter
- `query` (optional) → Semantic search on code embeddings

---

## 🤖 AI Agent Integration

### LangChain Evaluation Pipeline

The AI agent (`ai_agent.py`) uses:
- **LLM**: Google Gemini (free tier)
- **Framework**: LangChain LCEL (Runnable Sequences)
- **Output**: Pydantic structured JSON

### How It Works

1. **Prompt Template** → Instructs Gemini to act as technical recruiter
2. **Code Context** → GitHub repos, README, recent commits
3. **Job Description** → What skills are required
4. **Structured Output** → Pydantic model validates response

### Example: Manual Evaluation

```python
import asyncio
from ai_agent import evaluate_candidate_code

async def main():
    evaluation = await evaluate_candidate_code(
        job_description="React/Next.js engineer, 5+ years...",
        github_code_context="Recent repos: design-system, next-commerce..."
    )
    
    print(f"Score: {evaluation.skill_score}/100")
    print(f"Summary: {evaluation.summary}")
    print(f"Frameworks: {evaluation.frameworks}")

asyncio.run(main())
```

### Output Format

```json
{
  "skill_score": 94,
  "summary": [
    "Demonstrates advanced React state management...",
    "Ships fully accessible components...",
    "Strong performance instincts..."
  ],
  "frameworks": ["React", "Next.js", "TypeScript", "Tailwind"],
  "evidence": [
    {
      "type": "snippet",
      "repo": "elenavasquez/design-system",
      "label": "Type-safe reducer hook",
      "content": "function useToggleGroup<T>(...) { ... }",
      "language": "ts"
    },
    {
      "type": "commit",
      "repo": "elenavasquez/design-system",
      "label": "Accessibility hardening",
      "content": "fix(a11y): trap focus in Dialog..."
    }
  ]
}
```

### Rate Limiting & Retries

The agent automatically handles rate limits:

```python
# Free tier: 60 requests/min
# If hit: exponential backoff retry (2s, 4s, 8s)
evaluation = await evaluate_candidate_code(
    job_description=jd,
    github_code_context=code,
    max_retries=3,      # Default
    backoff_base=2.0    # Seconds
)
```

---

## 🎨 Frontend Integration

### Login Flow

**File:** `app/login/page.tsx`

```typescript
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) redirect("/dashboard")
  
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
```

### Dashboard Layout

**File:** `app/dashboard/[roleId]/page.tsx`

Shows:
- **Sidebar** → Job roles navigation
- **Header** → Role title, stats (total candidates, validated)
- **Table** → Candidates ranked by "Proof-of-Skill" score
- **Drawer** → Deep-dive modal when candidate clicked

### Starting a Scan

**File:** `components/dashboard/new-scan-dialog.tsx`

```typescript
async function handleScan(candidateId: string, githubUrl: string) {
  const response = await fetch("/api/v1/scan", {
    method: "POST",
    body: JSON.stringify({
      candidate_id: candidateId,
      github_url: githubUrl,
      job_description_id: "jd-frontend-1"
    })
  })
  
  const { task_id } = await response.json()
  
  // Poll status
  pollScanStatus(task_id)
}
```

### Polling Status

```typescript
async function pollScanStatus(taskId: string) {
  const maxAttempts = 60  // 5 minutes (5s per poll)
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/v1/scan/status/${taskId}`)
    const status = await response.json()
    
    if (status.status === "completed") {
      console.log(`Score: ${status.skill_score}`)
      break
    } else if (status.status === "rate_limited") {
      console.log("Rate limited, retrying...")
      await sleep(10000)  // Wait 10s before retry
    } else {
      console.log(`Status: ${status.progress}`)
      await sleep(5000)   // Poll every 5 seconds
    }
  }
}
```

---

## 🚢 Deployment

### Backend (FastAPI)

#### Option 1: Heroku (Easy)

```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Deploy
heroku create aura-backend
heroku config:set GOOGLE_API_KEY=xxx REDIS_URL=redis://...
git push heroku main
```

#### Option 2: Railway

```bash
# Deploy via CLI
railway up

# Or via GitHub
# 1. Push to GitHub
# 2. Import repo in railway.app
# 3. Railway auto-detects FastAPI
```

#### Option 3: AWS Lambda + API Gateway

```bash
# Use Mangum for ASGI adapter
pip install mangum

# handler.py
from mangum import Mangum
from main import app

handler = Mangum(app)
```

### Frontend (Next.js)

#### Option 1: Vercel (Recommended)

```bash
# Connect GitHub repo
# https://vercel.com/new

# Or via CLI
npm install -g vercel
vercel
```

#### Option 2: Netlify

```bash
# Connect GitHub repo
# https://netlify.com/drop
```

#### Option 3: Self-hosted

```bash
# Build & start
npm run build
npm start
```

### Database (Supabase)

- ✅ Already hosted in cloud
- ✅ Automatic backups
- ✅ pgvector support built-in

---

## 🔍 Monitoring & Debugging

### Check Backend Health

```bash
# Health check
curl http://localhost:8000/health

# Response
{"status": "ok", "redis": "connected"}
```

### View Logs

```bash
# Backend (FastAPI/Uvicorn)
tail -f backend.log

# Redis
redis-cli MONITOR

# Supabase (Dashboard)
# https://app.supabase.com → Logs tab
```

### Redis Cache Inspection

```bash
redis-cli

# List all keys
KEYS *

# Check candidate evaluation cache
GET candidate:c-elena:evaluation

# Clear cache for testing
DEL candidate:c-elena:evaluation
```

---

## 🐛 Troubleshooting

### Issue: "GOOGLE_API_KEY not set"

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check key is set
grep GOOGLE_API_KEY .env

# If missing:
# 1. Go to https://aistudio.google.com
# 2. Click "Get API Key"
# 3. Paste into .env
```

### Issue: "Redis connection refused"

**Solution:**
```bash
# Start Redis
redis-server

# Or via Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping  # Should return PONG
```

### Issue: "Rate limited by Gemini (429)"

**Solution:**
```
Free tier limit: 60 requests per minute

Options:
1. Wait 60 seconds (automatic retry with backoff)
2. Use paid API tier ($0.075 per 1M input tokens)
3. Use OpenRouter free models instead
```

### Issue: "Supabase connection failed"

**Solution:**
```bash
# Verify credentials
grep SUPABASE .env

# Test connection
curl https://your-project.supabase.co/rest/v1/users \
  -H "Authorization: Bearer YOUR_KEY"

# Check if schema is created
# Go to Supabase dashboard → SQL Editor
# SELECT * FROM information_schema.tables
```

### Issue: "Frontend can't reach backend"

**Solution:**
```typescript
// Check CORS is enabled in main.py
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000", "https://yourdomain.com"],
)

// Verify backend URL in frontend
const API_URL = "http://localhost:8000"  // Dev
const API_URL = "https://api.aura.app"   // Prod
```

---

## 📚 Project Structure

```
aura/
├── scripts/
│   └── 001_init_schema.sql          # Database schema
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── auth-layout.tsx
│   ├── dashboard/
│   │   ├── candidate-rankings.tsx
│   │   ├── deep-dive-drawer.tsx
│   │   └── sidebar.tsx
│   └── ui/                           # Shadcn UI components
├── app/
│   ├── login/page.tsx
│   ├── dashboard/[roleId]/page.tsx
│   └── layout.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── types.ts
│   └── mock-data.ts
│
├── backend/
│   ├── main.py                       # FastAPI app
│   ├── ai_agent.py                   # LangChain evaluation
│   ├── requirements.txt
│   └── .env.example
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 Next Steps

1. **Complete Setup** → Follow installation steps above
2. **Test Backend** → `curl http://localhost:8000/health`
3. **Test Frontend** → Open `http://localhost:3000`
4. **Trigger a Scan** → Use "New Scan" button in dashboard
5. **Monitor Status** → Watch console for progress
6. **Deploy** → Push to Heroku (backend) + Vercel (frontend)

---

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@aura.app

---

## 📄 License

MIT License - see LICENSE file

---

**Built with ❤️ for technical recruiting**
