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