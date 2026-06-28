"""
Aura Backend: FastAPI server for AI-powered candidate validation
Handles async GitHub ingestion, LLM evaluation, and persistent storage to Supabase
"""

import os
import json
import asyncio
import uuid
from datetime import datetime
from typing import Optional
from enum import Enum

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
import redis.asyncio as redis
from contextlib import asynccontextmanager

# Import AI evaluation chain (from ai_agent.py)
from ai_agent import evaluate_candidate_code, CandidateEvaluation

load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

GITHUB_API_TOKEN = os.getenv("GITHUB_API_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Concurrency limits
MAX_CONCURRENT_GITHUB = 5
MAX_CONCURRENT_LLM = 2

# Cache TTL
CACHE_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days


# ============================================================================
# ENUMS & DATA MODELS
# ============================================================================

class ScanStatus(str, Enum):
    PENDING = "pending"
    FETCHING = "fetching"
    EVALUATING = "evaluating"
    RATE_LIMITED = "rate_limited"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanRequest(BaseModel):
    candidate_id: str = Field(..., description="UUID of candidate to scan")
    github_url: str = Field(..., description="GitHub URL of candidate")
    job_description_id: str = Field(..., description="Job description ID")

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "c-elena",
                "github_url": "https://github.com/elenavasquez",
                "job_description_id": "jd-frontend-1",
            }
        }


class ScanResponse(BaseModel):
    task_id: str = Field(..., description="Unique task identifier for polling")
    status: str = Field(default="pending", description="Initial status")
    created_at: str = Field(..., description="ISO 8601 timestamp")


class ScanStatusResponse(BaseModel):
    task_id: str
    status: ScanStatus
    candidate_id: Optional[str] = None
    skill_score: Optional[int] = None
    summary: Optional[dict] = None
    progress: Optional[str] = None
    error: Optional[str] = None


class CandidateScore(BaseModel):
    id: str
    name: str
    github_url: str
    skill_score: int
    summary: Optional[dict] = None
    status: str
    created_at: str


# ============================================================================
# GLOBAL STATE
# ============================================================================

TASK_STORE: dict[str, dict] = {}
github_semaphore = asyncio.Semaphore(MAX_CONCURRENT_GITHUB)
llm_semaphore = asyncio.Semaphore(MAX_CONCURRENT_LLM)
redis_client: Optional[redis.Redis] = None
http_client: Optional[httpx.AsyncClient] = None


# ============================================================================
# LIFECYCLE
# ============================================================================

async def init_clients():
    global redis_client, http_client

    # BUG FIX: Render Redis uses TLS (rediss://) — pass ssl=True via URL; also
    # decode_responses must be True so we get strings back from Redis.
    try:
        redis_client = await redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
        )
        await redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️ Redis unavailable: {e}. Using in-memory fallback.")
        redis_client = None

    http_client = httpx.AsyncClient(
        timeout=30.0,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        headers={"Accept": "application/vnd.github.v3+json"},
    )
    print("✅ HTTP client initialized")


async def cleanup_clients():
    if redis_client:
        await redis_client.close()
    if http_client:
        await http_client.aclose()
    print("✅ Clients cleaned up")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_clients()
    yield
    await cleanup_clients()


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Aura Backend API",
    description="AI-powered candidate validation engine",
    version="1.0.0",
    lifespan=lifespan,
)

# BUG FIX: CORS origins should be configurable via env for production
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://aura.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# GITHUB INGESTION
# ============================================================================

async def fetch_github_repos(github_url: str) -> dict:
    if not http_client:
        raise RuntimeError("HTTP client not initialized")

    async with github_semaphore:
        username = github_url.rstrip("/").split("/")[-1]

        query = """
        query($userName:String!) {
          user(login: $userName) {
            repositories(first: 5, orderBy: {field: STARGAZERS, direction: DESC}) {
              nodes {
                name
                description
                url
                primaryLanguage { name }
                stargazerCount
                forkCount
              }
            }
          }
        }
        """

        headers = {}
        if GITHUB_API_TOKEN:
            headers["Authorization"] = f"Bearer {GITHUB_API_TOKEN}"

        try:
            response = await http_client.post(
                "https://api.github.com/graphql",
                json={"query": query, "variables": {"userName": username}},
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                raise Exception(f"GraphQL error: {data['errors']}")

            repos = (
                data.get("data", {})
                .get("user", {})
                .get("repositories", {})
                .get("nodes", [])
            )
            return {"repos": repos, "username": username}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise Exception("GitHub API rate limited (429)")
            raise


async def extract_code_snippets(repo_info: dict) -> str:
    return f"""
Repository: {repo_info.get('name', 'unknown')}
Stars: {repo_info.get('stargazerCount', 0)}
Language: {repo_info.get('primaryLanguage', {}).get('name', 'Unknown')}
Description: {repo_info.get('description', 'N/A')}
"""


async def evaluate_with_ai(job_description: str, code_context: str) -> CandidateEvaluation:
    async with llm_semaphore:
        return await evaluate_candidate_code(
            job_description=job_description,
            github_code_context=code_context,
        )


# ============================================================================
# SUPABASE PERSISTENCE
# ============================================================================

async def store_evaluation_to_supabase(
    candidate_id: str,
    recruiter_id: str,
    evaluation: CandidateEvaluation,
) -> None:
    if not http_client or not SUPABASE_URL:
        print("⚠️ Supabase not configured. Skipping persistence.")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    payload = {
        "candidate_id": candidate_id,
        "recruiter_id": recruiter_id,
        "skill_score": evaluation.skill_score,
        "summary": evaluation.summary,
        "frameworks": evaluation.frameworks,
        "evidence": [item.model_dump() for item in evaluation.evidence],
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/evaluations"
        res = await http_client.post(url, json=payload, headers=headers)
        res.raise_for_status()
        print(f"💾 Stored evaluation for candidate {candidate_id}")
    except Exception as err:
        print(f"❌ Supabase write failed: {err}")


# ============================================================================
# BACKGROUND TASK
# ============================================================================

async def scan_candidate_background(
    task_id: str,
    candidate_id: str,
    github_url: str,
    job_description_id: str,
    recruiter_id: str,
) -> None:
    task = TASK_STORE.get(task_id)
    if not task:
        return

    try:
        task["status"] = ScanStatus.PENDING
        cache_key = f"candidate:{candidate_id}:evaluation"

        # Step 1: Check Redis cache
        if redis_client:
            cached = await redis_client.get(cache_key)
            if cached:
                task["status"] = ScanStatus.COMPLETED
                task["summary"] = json.loads(cached)
                task["skill_score"] = task["summary"].get("skill_score")
                task["completed_at"] = datetime.utcnow().isoformat()
                return

        # Step 2: Fetch GitHub repos
        task["status"] = ScanStatus.FETCHING
        task["progress"] = "Fetching GitHub repositories..."
        repo_data = await fetch_github_repos(github_url)

        # Step 3: Extract code snippets
        code_context = ""
        for repo in repo_data.get("repos", [])[:3]:
            code_context += await extract_code_snippets(repo) + "\n"

        # Step 4: AI evaluation
        task["status"] = ScanStatus.EVALUATING
        task["progress"] = "Running AI evaluation..."
        job_description = f"Job ID: {job_description_id}"
        evaluation = await evaluate_with_ai(job_description, code_context)

        # Step 5: Store results
        task["status"] = ScanStatus.COMPLETED
        task["skill_score"] = evaluation.skill_score
        task["summary"] = {
            "skill_score": evaluation.skill_score,
            "summary": evaluation.summary,
            "frameworks": evaluation.frameworks,
            "evidence": [item.model_dump() for item in evaluation.evidence],
        }

        await store_evaluation_to_supabase(candidate_id, recruiter_id, evaluation)

        if redis_client:
            await redis_client.setex(
                cache_key,
                CACHE_TTL_SECONDS,
                json.dumps(task["summary"]),
            )

        task["completed_at"] = datetime.utcnow().isoformat()
        print(f"✅ Scan completed for {candidate_id}: score {evaluation.skill_score}")

    except Exception as e:
        error_msg = str(e)
        if "rate limited" in error_msg.lower() or "429" in error_msg:
            task["status"] = ScanStatus.RATE_LIMITED
            task["progress"] = "Rate limited. Will retry."
        else:
            task["status"] = ScanStatus.FAILED
            task["error"] = error_msg
        print(f"❌ Scan failed for {candidate_id}: {error_msg}")


# ============================================================================
# REST ENDPOINTS
# ============================================================================

@app.post("/api/v1/scan", response_model=ScanResponse, status_code=202)
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    TASK_STORE[task_id] = {
        "task_id": task_id,
        "candidate_id": request.candidate_id,
        "status": ScanStatus.PENDING,
        "created_at": now,
        "progress": "Queued for processing...",
    }

    background_tasks.add_task(
        scan_candidate_background,
        task_id=task_id,
        candidate_id=request.candidate_id,
        github_url=request.github_url,
        job_description_id=request.job_description_id,
        recruiter_id="recruiter-123",  # TODO: extract from auth token
    )

    return ScanResponse(task_id=task_id, created_at=now)


@app.get("/api/v1/scan/status/{task_id}", response_model=ScanStatusResponse)
async def get_scan_status(task_id: str):
    task = TASK_STORE.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return ScanStatusResponse(
        task_id=task_id,
        status=task.get("status", ScanStatus.PENDING),
        candidate_id=task.get("candidate_id"),
        skill_score=task.get("skill_score"),
        summary=task.get("summary"),
        progress=task.get("progress"),
        error=task.get("error"),
    )


@app.get("/api/v1/candidates", response_model=list[CandidateScore])
async def list_candidates(
    role_id: str = Query(..., description="Job role ID to filter candidates"),
    query: Optional[str] = Query(None, description="Semantic search query"),
):
    # Placeholder — wire to Supabase in production
    candidates = [
        CandidateScore(
            id="c-elena",
            name="Elena Vasquez",
            github_url="https://github.com/elenavasquez",
            skill_score=94,
            status="completed",
            created_at=datetime.utcnow().isoformat(),
        ),
        CandidateScore(
            id="c-marcus",
            name="Marcus Lee",
            github_url="https://github.com/marcuslee",
            skill_score=81,
            status="completed",
            created_at=datetime.utcnow().isoformat(),
        ),
    ]
    return candidates


@app.get("/health")
async def health_check():
    redis_status = "disconnected"
    if redis_client:
        try:
            await redis_client.ping()
            redis_status = "connected"
        except Exception:
            redis_status = "error"

    return {
        "status": "ok",
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat(),
    }


# BUG FIX: Exception handler had broken syntax (dict wrapping a JSONResponse call).
# Correct form uses return with a JSONResponse object directly.
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "type": type(exc).__name__},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)
