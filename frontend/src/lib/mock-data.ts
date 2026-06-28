import type { Candidate, JobRole } from "@/lib/types"

export const JOB_ROLES: JobRole[] = [
  {
    id: "frontend-developer",
    title: "Frontend Developer",
    description:
      "React/Next.js engineer focused on accessible, performant UI, design systems, and state management.",
    candidateCount: 3,
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer",
    description:
      "Builds resilient distributed services, async pipelines, and well-designed REST/GraphQL APIs.",
    candidateCount: 3,
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    description:
      "Applies ML, statistics, and data pipelines to ship production model-driven features.",
    candidateCount: 2,
  },
]

export const CANDIDATES: Record<string, Candidate[]> = {
  "frontend-developer": [
    {
      id: "c-elena",
      name: "Elena Vasquez",
      title: "Senior Frontend Engineer",
      githubUrl: "https://github.com/elenavasquez",
      portfolioUrl: "https://elena.dev",
      location: "Barcelona, ES",
      skillScore: 94,
      frameworks: ["React", "Next.js", "TypeScript", "Tailwind"],
      status: "completed",
      summary: [
        "Demonstrates advanced React state management with custom hooks and predictable reducers across a 40k-line codebase.",
        "Ships fully accessible components — keyboard navigation, ARIA roles, and focus traps are consistently implemented.",
        "Strong performance instincts: memoization, route-level code splitting, and image optimization appear throughout.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "elenavasquez/design-system",
          label: "Type-safe reducer hook",
          language: "ts",
          content:
            "function useToggleGroup<T extends string>(initial: T[]) {\n  return useReducer((state: Set<T>, action: { type: 'toggle'; value: T }) => {\n    const next = new Set(state)\n    next.has(action.value) ? next.delete(action.value) : next.add(action.value)\n    return next\n  }, new Set(initial))\n}",
        },
        {
          type: "commit",
          repo: "elenavasquez/design-system",
          label: "Accessibility hardening",
          content:
            "fix(a11y): trap focus in Dialog and restore trigger focus on close (WCAG 2.4.3)",
        },
        {
          type: "snippet",
          repo: "elenavasquez/next-commerce",
          label: "Suspense-based data boundary",
          language: "tsx",
          content:
            "export default function ProductPage({ params }: Props) {\n  return (\n    <Suspense fallback={<ProductSkeleton />}>\n      <ProductDetail id={params.id} />\n    </Suspense>\n  )\n}",
        },
      ],
      scannedAt: "2026-06-15T10:22:00Z",
    },
    {
      id: "c-marcus",
      name: "Marcus Lee",
      title: "Frontend Engineer",
      githubUrl: "https://github.com/marcuslee",
      portfolioUrl: "https://marcuslee.io",
      location: "Toronto, CA",
      skillScore: 81,
      frameworks: ["React", "Vue", "JavaScript", "CSS"],
      status: "portfolio_analyzed",
      summary: [
        "Solid component composition with clear separation between presentational and container layers.",
        "Comfortable across two frameworks (React and Vue) with idiomatic usage in both ecosystems.",
        "Test coverage is present but uneven — critical flows are tested, edge cases less so.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "marcuslee/vue-dashboard",
          label: "Composable for fetch state",
          language: "ts",
          content:
            "export function useAsync<T>(fn: () => Promise<T>) {\n  const data = ref<T>()\n  const error = ref<Error>()\n  const loading = ref(true)\n  fn().then(d => (data.value = d)).catch(e => (error.value = e)).finally(() => (loading.value = false))\n  return { data, error, loading }\n}",
        },
        {
          type: "commit",
          repo: "marcuslee/react-kanban",
          label: "Drag and drop polish",
          content: "feat: persist column order with optimistic updates + rollback on failure",
        },
      ],
      scannedAt: "2026-06-15T09:05:00Z",
    },
    {
      id: "c-priya",
      name: "Priya Nair",
      title: "UI Engineer",
      githubUrl: "https://github.com/priyanair",
      location: "Bengaluru, IN",
      skillScore: 68,
      frameworks: ["React", "Tailwind", "JavaScript"],
      status: "github_scanned",
      summary: [
        "Clean, readable JSX and consistent use of utility-first styling conventions.",
        "Limited evidence of complex state handling — most projects are presentational in scope.",
        "Good commit hygiene with descriptive, scoped messages across repositories.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "priyanair/portfolio",
          label: "Animated theme toggle",
          language: "tsx",
          content:
            "const ThemeToggle = () => {\n  const [dark, setDark] = useState(false)\n  useEffect(() => document.documentElement.classList.toggle('dark', dark), [dark])\n  return <button onClick={() => setDark(d => !d)} aria-label=\"Toggle theme\" />\n}",
        },
        {
          type: "commit",
          repo: "priyanair/recipe-finder",
          label: "Responsive grid",
          content: "style: convert recipe list to responsive CSS grid with auto-fit minmax",
        },
      ],
      scannedAt: "2026-06-14T18:40:00Z",
    },
  ],
  "backend-engineer": [
    {
      id: "c-david",
      name: "David Okafor",
      title: "Staff Backend Engineer",
      githubUrl: "https://github.com/davidokafor",
      portfolioUrl: "https://okafor.engineering",
      location: "Lagos, NG",
      skillScore: 91,
      frameworks: ["Go", "PostgreSQL", "gRPC", "Kubernetes"],
      status: "completed",
      summary: [
        "Designs for failure: circuit breakers, exponential backoff, and idempotent handlers appear consistently.",
        "Strong database fundamentals — indexed access paths, careful transaction scoping, and migration discipline.",
        "Concurrency is handled correctly with context cancellation and bounded worker pools.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "davidokafor/ingest-pipeline",
          label: "Bounded concurrency with semaphore",
          language: "go",
          content:
            "sem := make(chan struct{}, 5)\nfor _, job := range jobs {\n  sem <- struct{}{}\n  go func(j Job) {\n    defer func() { <-sem }()\n    process(ctx, j)\n  }(job)\n}",
        },
        {
          type: "commit",
          repo: "davidokafor/ingest-pipeline",
          label: "Resilience",
          content: "feat(retry): add jittered exponential backoff for 429/503 from upstream",
        },
      ],
      scannedAt: "2026-06-15T11:10:00Z",
    },
    {
      id: "c-sofia",
      name: "Sofia Rossi",
      title: "Backend Engineer",
      githubUrl: "https://github.com/sofiarossi",
      location: "Milan, IT",
      skillScore: 84,
      frameworks: ["Python", "FastAPI", "Redis", "Docker"],
      status: "completed",
      summary: [
        "Async I/O is used correctly throughout — no blocking calls leak into the event loop.",
        "Clean Pydantic models with validation enforce strong contracts at API boundaries.",
        "Caching strategy is thoughtful, with TTLs and cache invalidation on writes.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "sofiarossi/async-api",
          label: "Async endpoint with caching",
          language: "py",
          content:
            "@router.get('/items/{id}')\nasync def get_item(id: str):\n    if cached := await redis.get(f'item:{id}'):\n        return json.loads(cached)\n    item = await db.fetch_item(id)\n    await redis.set(f'item:{id}', item.json(), ex=300)\n    return item",
        },
        {
          type: "commit",
          repo: "sofiarossi/async-api",
          label: "Validation",
          content: "refactor: replace dict payloads with Pydantic v2 models for request validation",
        },
      ],
      scannedAt: "2026-06-15T08:33:00Z",
    },
    {
      id: "c-james",
      name: "James Carter",
      title: "Software Engineer",
      githubUrl: "https://github.com/jamescarter",
      location: "Austin, US",
      skillScore: 72,
      frameworks: ["Node.js", "Express", "MongoDB"],
      status: "github_scanned",
      summary: [
        "Functional REST APIs with reasonable route organization and middleware usage.",
        "Error handling is inconsistent — some routes lack try/catch around async operations.",
        "Limited use of indexes; some queries would not scale under load.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "jamescarter/task-api",
          label: "Express route",
          language: "js",
          content:
            "app.get('/tasks', async (req, res) => {\n  const tasks = await Task.find({ userId: req.user.id })\n  res.json(tasks)\n})",
        },
        {
          type: "commit",
          repo: "jamescarter/task-api",
          label: "Auth",
          content: "feat: add JWT auth middleware to protect task routes",
        },
      ],
      scannedAt: "2026-06-14T20:15:00Z",
    },
  ],
  "data-scientist": [
    {
      id: "c-amara",
      name: "Amara Diallo",
      title: "Senior Data Scientist",
      githubUrl: "https://github.com/amaradiallo",
      portfolioUrl: "https://amara.ai",
      location: "Dakar, SN",
      skillScore: 89,
      frameworks: ["Python", "PyTorch", "Pandas", "scikit-learn"],
      status: "completed",
      summary: [
        "Rigorous experimentation — train/validation/test splits and reproducible seeds are standard practice.",
        "Production-aware: models are wrapped with clear inference APIs and input validation.",
        "Clear data lineage and feature engineering documented within notebooks and scripts.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "amaradiallo/churn-model",
          label: "Reproducible training loop",
          language: "py",
          content:
            "torch.manual_seed(SEED)\nfor epoch in range(EPOCHS):\n    model.train()\n    for xb, yb in train_loader:\n        opt.zero_grad()\n        loss = criterion(model(xb), yb)\n        loss.backward()\n        opt.step()",
        },
        {
          type: "commit",
          repo: "amaradiallo/churn-model",
          label: "Evaluation",
          content: "feat: add stratified k-fold CV and log ROC-AUC per fold to MLflow",
        },
      ],
      scannedAt: "2026-06-15T07:50:00Z",
    },
    {
      id: "c-tom",
      name: "Tom Becker",
      title: "Data Analyst → Scientist",
      githubUrl: "https://github.com/tombecker",
      location: "Berlin, DE",
      skillScore: 65,
      frameworks: ["Python", "Pandas", "SQL"],
      status: "portfolio_analyzed",
      summary: [
        "Strong exploratory analysis and clear, well-labeled visualizations.",
        "ML work is mostly notebook-bound with limited productionization evidence.",
        "Good SQL skills for aggregation and window functions across analytical queries.",
      ],
      evidence: [
        {
          type: "snippet",
          repo: "tombecker/sales-analysis",
          label: "Window function query",
          language: "sql",
          content:
            "SELECT region, month,\n  SUM(revenue) OVER (PARTITION BY region ORDER BY month) AS running_total\nFROM sales\nORDER BY region, month;",
        },
        {
          type: "commit",
          repo: "tombecker/sales-analysis",
          label: "Notebook",
          content: "analysis: add cohort retention heatmap and seasonality decomposition",
        },
      ],
      scannedAt: "2026-06-14T16:05:00Z",
    },
  ],
}

export function getRole(roleId: string): JobRole | undefined {
  return JOB_ROLES.find((r) => r.id === roleId)
}

export function getCandidates(roleId: string): Candidate[] {
  return (CANDIDATES[roleId] ?? [])
    .slice()
    .sort((a, b) => b.skillScore - a.skillScore)
}
