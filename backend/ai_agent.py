# # """
# # Aura AI Agent: LangChain-based code evaluation pipeline
# # Evaluates candidate code against job descriptions using Google Gemini (free tier)
# # """

# # import os
# # from typing import Optional
# # from dotenv import load_dotenv
# # from pydantic import BaseModel, Field
# # from langchain_core.prompts import ChatPromptTemplate
# # from langchain_google_genai import ChatGoogleGenerativeAI
# # from langchain_core.output_parsers import JsonOutputParser
# # import asyncio

# # # Load environment variables
# # load_dotenv()

# # # ============================================================================
# # # PYDANTIC MODELS FOR STRUCTURED OUTPUT
# # # ============================================================================

# # class EvidenceItem(BaseModel):
# #     """A code snippet or commit message used as evidence for evaluation"""
# #     type: str = Field(..., description="'snippet' or 'commit'")
# #     repo: str = Field(..., description="Repository name (owner/repo)")
# #     label: str = Field(..., description="Short title for this evidence")
# #     content: str = Field(..., description="Code snippet or commit message")
# #     language: Optional[str] = Field(None, description="Programming language if snippet")


# # class CandidateEvaluation(BaseModel):
# #     """Structured evaluation output from the AI"""
# #     skill_score: int = Field(
# #         ..., 
# #         ge=0, 
# #         le=100,
# #         description="Overall skill score from 0-100 based on code analysis"
# #     )
# #     summary: list[str] = Field(
# #         ..., 
# #         min_items=3,
# #         max_items=3,
# #         description="Exactly 3 bullet points summarizing key findings"
# #     )
# #     evidence: list[EvidenceItem] = Field(
# #         ..., 
# #         min_items=1,
# #         max_items=5,
# #         description="1-5 code snippets or commits supporting the evaluation"
# #     )
# #     frameworks: list[str] = Field(
# #         ...,
# #         description="Detected frameworks and technologies from code"
# #     )


# # # ============================================================================
# # # LANGCHAIN EVALUATION CHAIN
# # # ============================================================================

# # def create_evaluation_chain():
# #     """
# #     Create a LangChain LCEL chain for candidate code evaluation.
# #     Uses Google Gemini API (free tier) via ChatGoogleGenerativeAI.
    
# #     Environment Setup:
# #     1. Get your free Gemini API key from Google AI Studio: https://aistudio.google.com
# #     2. Set GOOGLE_API_KEY environment variable:
# #        export GOOGLE_API_KEY="your-key-here"
# #     3. Or add to .env file:
# #        GOOGLE_API_KEY=your-key-here
# #     """
    
# #     # ========== STEP 1: CREATE PROMPT TEMPLATE ==========
# #     prompt = ChatPromptTemplate.from_messages([
# #         (
# #             "system",
# #             """You are a Senior Technical Recruiter with 15+ years of hiring experience.
# # Your task is to evaluate a candidate's code and GitHub presence against a job description.

# # EVALUATION CRITERIA:
# # 1. **Code Quality & Architecture**: Is the code clean, well-structured, and maintainable?
# # 2. **Technical Depth**: Does this person demonstrate deep understanding or just surface-level knowledge?
# # 3. **Relevance to Role**: How relevant is their code to the job description requirements?
# # 4. **Production Readiness**: Is the code production-ready with error handling, testing, and documentation?
# # 5. **Problem-Solving**: Do they tackle hard problems or only simple ones?

# # OUTPUT REQUIREMENTS:
# # - skill_score: An integer 0-100. Use the full range. 90+ = exceptional, 70-89 = strong, 50-69 = competent, <50 = concerning.
# # - summary: Exactly 3 bullet points (max 2 sentences each) highlighting key strengths or gaps.
# # - evidence: 1-5 real code snippets or commit messages from the provided context. Quote EXACTLY as provided.
# # - frameworks: List 3-6 frameworks/technologies detected in their code.

# # Be specific. Avoid generic praise. If code is mediocre, say so and explain why."""
# #         ),
# #         (
# #             "human",
# #             """
# # JOB DESCRIPTION:
# # {job_description}

# # ---

# # CANDIDATE'S CODE CONTEXT (GitHub repos, README, dependencies, recent commits):
# # {github_code_context}

# # ---

# # Evaluate this candidate thoroughly and return a JSON object matching the schema provided.
# # Focus on evidence from their actual code, not assumptions."""
# #         )
# #     ])
    
# #     # ========== STEP 2: INITIALIZE GEMINI LLM ==========
# #     api_key = os.getenv("GOOGLE_API_KEY")
# #     if not api_key:
# #         raise ValueError(
# #             "GOOGLE_API_KEY environment variable not set. "
# #             "Get a free key from https://aistudio.google.com"
# #         )
    
# #     llm = ChatGoogleGenerativeAI(
# #         model="gemini-2-flash",  # Free, fast, and capable
# #         google_api_key=api_key,
# #         temperature=0.1,  # Low temperature for analytical accuracy
# #         max_tokens=2000,  # Sufficient for detailed evaluation
# #     )
    
# #     # ========== STEP 3: BIND STRUCTURED OUTPUT ==========
# #     # Use with_structured_output to enforce JSON schema
# #     llm_with_structure = llm.with_structured_output(
# #         CandidateEvaluation,
# #         method="json_mode"
# #     )
    
# #     # ========== STEP 4: CREATE CHAIN (LCEL) ==========
# #     # Pipe: prompt → LLM with structured output → automatic parsing
# #     chain = prompt | llm_with_structure
    
# #     return chain


# # # ============================================================================
# # # ASYNC EVALUATION FUNCTION WITH RESILIENCE
# # # ============================================================================

# # async def evaluate_candidate_code(
# #     job_description: str,
# #     github_code_context: str,
# #     max_retries: int = 3,
# #     backoff_base: float = 2.0,
# # ) -> CandidateEvaluation:
# #     """
# #     Asynchronously evaluate a candidate's code against a job description.
    
# #     Implements exponential backoff retry logic for rate limiting (429 errors).
    
# #     Args:
# #         job_description: The job description to evaluate against
# #         github_code_context: Code snippets and commits from candidate's GitHub
# #         max_retries: Number of retries on rate limit (default: 3)
# #         backoff_base: Base for exponential backoff in seconds (default: 2.0)
    
# #     Returns:
# #         CandidateEvaluation: Structured evaluation with score, summary, and evidence
    
# #     Raises:
# #         Exception: If all retries are exhausted
    
# #     Example:
# #         >>> evaluation = await evaluate_candidate_code(
# #         ...     job_description="We're hiring a backend engineer...",
# #         ...     github_code_context="Recent repos:\n- async-api (FastAPI, Redis)..."
# #         ... )
# #         >>> print(f"Score: {evaluation.skill_score}")
# #     """
    
# #     chain = create_evaluation_chain()
    
# #     for attempt in range(max_retries):
# #         try:
# #             # Use ainvoke for async execution
# #             result = await chain.ainvoke(
# #                 {
# #                     "job_description": job_description,
# #                     "github_code_context": github_code_context,
# #                 }
# #             )
# #             return result
            
# #         except Exception as e:
# #             error_msg = str(e).lower()
            
# #             # Check if it's a rate limit error
# #             if "429" in error_msg or "quota" in error_msg or "rate" in error_msg:
# #                 if attempt < max_retries - 1:
# #                     # Calculate backoff with jitter
# #                     wait_time = backoff_base ** attempt + (0.1 * (attempt + 1))
# #                     print(
# #                         f"⏳ Rate limited. Retrying in {wait_time:.1f}s "
# #                         f"(attempt {attempt + 1}/{max_retries})..."
# #                     )
# #                     await asyncio.sleep(wait_time)
# #                     continue
# #                 else:
# #                     raise Exception(
# #                         f"❌ Rate limited after {max_retries} retries. "
# #                         "Please try again later or use a paid API tier."
# #                     ) from e
# #             else:
# #                 # Non-rate-limit error, raise immediately
# #                 raise Exception(f"❌ Evaluation failed: {e}") from e
    
# #     raise Exception("❌ Evaluation failed: max retries exceeded")


# # ============================================================================
# # EXAMPLE USAGE & TESTING
# # ============================================================================

# async def main():
#     """Example: Evaluate a hypothetical backend engineer candidate"""
    
#     job_description = """
#     Backend Engineer - Python/FastAPI
    
#     We're looking for a backend engineer with:
#     - 3+ years building async Python services
#     - Strong PostgreSQL and Redis experience
#     - REST API design and optimization
#     - Experience with Celery or task queues
#     - Familiarity with Docker and Kubernetes
    
#     Required: Error handling, logging, testing
#     """
    
#     github_code_context = """
#     Recent GitHub Activity:
    
#     Repository: sofiarossi/async-api (Python, FastAPI, Redis)
#     - Main tech: FastAPI, asyncio, Redis, PostgreSQL, Pydantic V2
#     - Stars: 142 | Forks: 18
    
#     Key Files:
#     1. app/routers/items.py:
#     @router.get('/items/{id}')
#     async def get_item(id: str):
#         if cached := await redis.get(f'item:{id}'):
#             return json.loads(cached)
#         item = await db.fetch_item(id)
#         await redis.set(f'item:{id}', item.json(), ex=300)
#         return item
    
#     2. app/models.py:
#     class ItemCreate(BaseModel):
#         name: str = Field(..., min_length=1, max_length=100)
#         description: Optional[str] = None
#         price: Decimal = Field(..., gt=0)
        
#     class Item(ItemCreate):
#         id: UUID
#         created_at: datetime
    
#     Recent Commits:
#     - feat: implement connection pooling for PostgreSQL (2 weeks ago)
#     - fix: add exponential backoff for Redis timeouts (1 week ago)
#     - refactor: replace dict payloads with Pydantic v2 models (3 days ago)
#     - test: add integration tests for async cache invalidation (yesterday)
#     """
    
#     print("🚀 Starting AI code evaluation...\n")
    
#     try:
#         evaluation = await evaluate_candidate_code(
#             job_description=job_description,
#             github_code_context=github_code_context,
#         )
        
#         print("✅ Evaluation Complete!\n")
#         print(f"📊 Skill Score: {evaluation.skill_score}/100")
#         print(f"\n📝 Summary:")
#         for i, point in enumerate(evaluation.summary, 1):
#             print(f"  {i}. {point}")
        
#         print(f"\n🛠️ Detected Frameworks: {', '.join(evaluation.frameworks)}")
        
#         print(f"\n📌 Evidence ({len(evaluation.evidence)} items):")
#         for ev in evaluation.evidence:
#             print(f"  - [{ev.type}] {ev.label}")
#             print(f"    Repo: {ev.repo}")
        
#         return evaluation
        
#     except Exception as e:
#         print(f"❌ Error during evaluation: {e}")
#         raise


# if __name__ == "__main__":
#     # Run the async example
#     asyncio.run(main())



"""
Aura AI Agent: LangChain-based code evaluation pipeline
Evaluates candidate code against job descriptions using Google Gemini (free tier)
"""

import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import asyncio

# Load environment variables
load_dotenv()

# ============================================================================
# PYDANTIC MODELS FOR STRUCTURED OUTPUT
# ============================================================================

class EvidenceItem(BaseModel):
    """A code snippet or commit message used as evidence for evaluation"""
    type: str = Field(..., description="'snippet' or 'commit'")
    repo: str = Field(..., description="Repository name (owner/repo)")
    label: str = Field(..., description="Short title for this evidence")
    content: str = Field(..., description="Code snippet or commit message")
    language: Optional[str] = Field(None, description="Programming language if snippet")


class CandidateEvaluation(BaseModel):
    """Structured evaluation output from the AI"""
    skill_score: int = Field(
        ..., 
        ge=0, 
        le=100,
        description="Overall skill score from 0-100 based on code analysis"
    )
    summary: list[str] = Field(
        ..., 
        min_length=3,
        max_length=3,
        description="Exactly 3 bullet points summarizing key findings"
    )
    evidence: list[EvidenceItem] = Field(
        ..., 
        min_length=1,
        max_length=5,
        description="1-5 code snippets or commits supporting the evaluation"
    )
    frameworks: list[str] = Field(
        ...,
        description="Detected frameworks and technologies from code"
    )


# ============================================================================
# LANGCHAIN EVALUATION CHAIN
# ============================================================================

def create_evaluation_chain():
    """
    Create a LangChain LCEL chain for candidate code evaluation.
    Uses Google Gemini API via ChatGoogleGenerativeAI.
    """
    
    # ========== STEP 1: CREATE PROMPT TEMPLATE ==========
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a Senior Technical Recruiter with 15+ years of hiring experience.
Your task is to evaluate a candidate's code and GitHub presence against a job description.

EVALUATION CRITERIA:
1. **Code Quality & Architecture**: Is the code clean, well-structured, and maintainable?
2. **Technical Depth**: Does this person demonstrate deep understanding or just surface-level knowledge?
3. **Relevance to Role**: How relevant is their code to the job description requirements?
4. **Production Readiness**: Is the code production-ready with error handling, testing, and documentation?
5. **Problem-Solving**: Do they tackle hard problems or only simple ones?

OUTPUT REQUIREMENTS:
- skill_score: An integer 0-100. Use the full range. 90+ = exceptional, 70-89 = strong, 50-69 = competent, <50 = concerning.
- summary: Exactly 3 bullet points (max 2 sentences each) highlighting key strengths or gaps.
- evidence: 1-5 real code snippets or commit messages from the provided context. Quote EXACTLY as provided.
- frameworks: List 3-6 frameworks/technologies detected in their code.

Be specific. Avoid generic praise. If code is mediocre, say so and explain why."""
        ),
        (
            "human",
            """
JOB DESCRIPTION:
{job_description}

---

CANDIDATE'S CODE CONTEXT (GitHub repos, README, dependencies, recent commits):
{github_code_context}

---

Evaluate this candidate thoroughly and return a JSON object matching the schema provided.
Focus on evidence from their actual code, not assumptions."""
        )
    ])
    
    # ========== STEP 2: INITIALIZE GEMINI LLM ==========
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable not set. "
            "Get a free key from https://aistudio.google.com"
        )
    
    # FIX 1: Updated to the correct canonical identifier for Gemini
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.1,
        max_tokens=2000,
    )
    
    # ========== STEP 3: BIND STRUCTURED OUTPUT ==========
    # FIX 2: Defaulting to Pydantic binding mechanism converts directly to object mapping
    llm_with_structure = llm.with_structured_output(
        CandidateEvaluation
    )
    
    # ========== STEP 4: CREATE CHAIN (LCEL) ==========
    chain = prompt | llm_with_structure
    
    return chain


# ============================================================================
# ASYNC EVALUATION FUNCTION WITH RESILIENCE
# ============================================================================

async def evaluate_candidate_code(
    job_description: str,
    github_code_context: str,
    max_retries: int = 3,
    backoff_base: float = 2.0,
) -> CandidateEvaluation:
    """
    Asynchronously evaluate a candidate's code against a job description.
    Implements exponential backoff retry logic for rate limiting (429 errors).
    """
    chain = create_evaluation_chain()
    
    for attempt in range(max_retries):
        try:
            result = await chain.ainvoke(
                {
                    "job_description": job_description,
                    "github_code_context": github_code_context,
                }
            )
            return result
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # Check if it's a rate limit error
            if "429" in error_msg or "quota" in error_msg or "rate" in error_msg:
                if attempt < max_retries - 1:
                    wait_time = (backoff_base ** attempt) + (0.1 * (attempt + 1))
                    print(
                        f"⏳ Rate limited. Retrying in {wait_time:.1f}s "
                        f"(attempt {attempt + 1}/{max_retries})..."
                    )
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    raise Exception(
                        f"❌ Rate limited after {max_retries} retries. "
                        "Please try again later or use a paid API tier."
                    ) from e
            else:
                raise Exception(f"❌ Evaluation failed: {e}") from e
    
    raise Exception("❌ Evaluation failed: max retries exceeded")