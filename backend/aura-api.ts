/**
 * Aura API Client
 * TypeScript utilities for frontend to communicate with FastAPI backend
 * 
 * Usage:
 * import { auraApi } from '@/lib/aura-api'
 * 
 * const { task_id } = await auraApi.startScan({...})
 * const status = await auraApi.getScanStatus(task_id)
 * const candidates = await auraApi.listCandidates(roleId)
 */

type ScanStatus = 
  | 'pending' 
  | 'fetching' 
  | 'evaluating' 
  | 'rate_limited' 
  | 'completed' 
  | 'failed'

interface ScanRequest {
  candidate_id: string
  github_url: string
  job_description_id: string
}

interface ScanResponse {
  task_id: string
  status: string
  created_at: string
}

interface ScanStatusResponse {
  task_id: string
  status: ScanStatus
  candidate_id: string | null
  skill_score: number | null
  summary: Record<string, unknown> | null
  progress: string | null
  error: string | null
}

interface CandidateScore {
  id: string
  name: string
  github_url: string
  skill_score: number
  summary: Record<string, unknown> | null
  status: string
  created_at: string
}

interface HealthResponse {
  status: string
  redis: string
  timestamp: string
}

/**
 * Aura API Client
 * All methods are async and handle errors gracefully
 */
class AuraApiClient {
  private baseUrl: string
  private timeout: number

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = timeout
  }

  /**
   * Private helper for HTTP requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          error.detail || error.message || `HTTP ${response.status}`
        )
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Health check - verify backend is running
   */
  async health(): Promise<HealthResponse> {
    try {
      return await this.request<HealthResponse>('/health')
    } catch (error) {
      throw new Error(`Backend health check failed: ${error}`)
    }
  }

  /**
   * POST /api/v1/scan
   * Initiate a candidate evaluation scan
   * Returns 202 Accepted with task_id for polling
   */
  async startScan(request: ScanRequest): Promise<ScanResponse> {
    if (!request.candidate_id?.trim()) {
      throw new Error('candidate_id is required')
    }
    if (!request.github_url?.trim()) {
      throw new Error('github_url is required')
    }
    if (!request.job_description_id?.trim()) {
      throw new Error('job_description_id is required')
    }

    try {
      const response = await this.request<ScanResponse>('/api/v1/scan', {
        method: 'POST',
        body: JSON.stringify(request),
      })
      return response
    } catch (error) {
      throw new Error(`Failed to start scan: ${error}`)
    }
  }

  /**
   * GET /api/v1/scan/status/{task_id}
   * Poll the status of a scan task
   * Use this in a polling loop (e.g., every 5 seconds)
   */
  async getScanStatus(taskId: string): Promise<ScanStatusResponse> {
    if (!taskId?.trim()) {
      throw new Error('taskId is required')
    }

    try {
      return await this.request<ScanStatusResponse>(
        `/api/v1/scan/status/${encodeURIComponent(taskId)}`
      )
    } catch (error) {
      throw new Error(`Failed to get scan status: ${error}`)
    }
  }

  /**
   * GET /api/v1/candidates
   * List candidates for a job role, optionally filtered by semantic search
   * Returns candidates sorted by skill_score descending
   */
  async listCandidates(
    roleId: string,
    query?: string
  ): Promise<CandidateScore[]> {
    if (!roleId?.trim()) {
      throw new Error('roleId is required')
    }

    try {
      const searchParams = new URLSearchParams()
      searchParams.append('role_id', roleId)
      if (query?.trim()) {
        searchParams.append('query', query)
      }

      return await this.request<CandidateScore[]>(
        `/api/v1/candidates?${searchParams.toString()}`
      )
    } catch (error) {
      throw new Error(`Failed to list candidates: ${error}`)
    }
  }
}

/**
 * Polling utility for scan status
 * Automatically retries with exponential backoff on rate limits
 */
export async function pollScanStatus(
  taskId: string,
  client: AuraApiClient,
  options: {
    maxAttempts?: number
    pollInterval?: number
    onProgress?: (status: ScanStatusResponse) => void
    onRateLimit?: (retryAfter: number) => void
  } = {}
): Promise<ScanStatusResponse> {
  const {
    maxAttempts = 120,  // 10 minutes (5s per poll)
    pollInterval = 5000, // 5 seconds
    onProgress = () => {},
    onRateLimit = () => {},
  } = options

  let attempt = 0
  let backoffMultiplier = 1

  while (attempt < maxAttempts) {
    try {
      const status = await client.getScanStatus(taskId)
      
      // Reset backoff on successful request
      backoffMultiplier = 1
      
      onProgress(status)

      if (status.status === 'completed') {
        return status
      }

      if (status.status === 'failed') {
        throw new Error(`Scan failed: ${status.error}`)
      }

      if (status.status === 'rate_limited') {
        const waitTime = pollInterval * 3 * backoffMultiplier
        onRateLimit(waitTime)
        backoffMultiplier = Math.min(backoffMultiplier * 2, 8) // Max 40s backoff
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      attempt++

    } catch (error) {
      // Network error, retry with backoff
      const waitTime = pollInterval * backoffMultiplier
      backoffMultiplier = Math.min(backoffMultiplier * 2, 8)
      console.error(`Poll error (attempt ${attempt + 1}):`, error)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      attempt++
    }
  }

  throw new Error(
    `Scan polling timeout after ${maxAttempts} attempts (${(maxAttempts * pollInterval) / 1000}s)`
  )
}

/**
 * Singleton instance - export and use throughout the app
 */
export const auraApi = new AuraApiClient()

export type { ScanRequest, ScanResponse, ScanStatusResponse, CandidateScore }
export default AuraApiClient
