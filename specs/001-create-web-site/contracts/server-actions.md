# Server Actions & Components Contract
# WFG Git Log Viewer - Next.js App Router Implementation
# Using Server Actions and React Server Components instead of REST API

## Server Actions

### 1. fetchGitCommits (Server Action)
```typescript
// File: src/lib/actions/git-actions.ts
'use server'

import { z } from 'zod'

const FetchCommitsSchema = z.object({
  author: z.string().min(1).max(255).trim(),
  since: z.date().max(new Date()).refine(
    date => date >= subDays(new Date(), 31),
    "Date must be within last 31 days"
  )
})

export async function fetchGitCommits(
  formData: FormData
): Promise<ActionResult<GitCommit[]>> {
  // Server-side Git operations
  // Returns: { success: true, data: GitCommit[] } | { success: false, error: string }
}
```

### 2. generateSummaries (Server Action)
```typescript
// File: src/lib/actions/summary-actions.ts
'use server'

const GenerateSummariesSchema = z.object({
  author: z.string().min(1).max(255),
  since: z.date(),
  refresh: z.boolean().optional()
})

export async function generateSummaries(
  formData: FormData
): Promise<ActionResult<DailySummary[]>> {
  // Server-side summary generation and database operations
  // Returns: { success: true, data: DailySummary[] } | { success: false, error: string }
}
```

### 3. refreshSummaries (Server Action)
```typescript
// File: src/lib/actions/summary-actions.ts
'use server'

export async function refreshSummaries(
  author: string,
  since: Date
): Promise<ActionResult<DailySummary[]>> {
  // Force regeneration of existing summaries
  // Returns updated summaries from database
}
```

## React Server Components

### 1. GitCommitsList (Server Component)
```typescript
// File: src/components/GitCommitsList.tsx
interface GitCommitsListProps {
  author: string
  since: Date
}

export default async function GitCommitsList({ author, since }: GitCommitsListProps) {
  // Server-side data fetching
  const commits = await getGitCommits(author, since)
  
  // Render commits with daily grouping
  return (
    <div className="commits-list">
      {/* Server-rendered commit list */}
    </div>
  )
}
```

### 2. DailySummariesView (Server Component)
```typescript
// File: src/components/DailySummariesView.tsx
interface DailySummariesViewProps {
  author: string
  since: Date
}

export default async function DailySummariesView({ author, since }: DailySummariesViewProps) {
  // Server-side database query
  const summaries = await getDailySummaries(author, since)
  
  // Render Thai-formatted summaries
  return (
    <div className="summaries-view">
      {/* Server-rendered summaries */}
    </div>
  )
}
```

## TypeScript Interfaces

### Core Data Types
```typescript
// File: src/types/git.ts
export interface GitCommit {
  hash: string
  author: string
  email: string
  date: Date
  message: string
  isMerge: boolean
}

export interface DailySummary {
  id: string
  authorName: string
  summaryDate: Date
  summaryText: string
  repositoryUrl: string
  createdAt: Date
  updatedAt: Date
}

export interface FilterCriteria {
  authorName: string
  sinceDate: Date
  repositoryPath: string
}

export interface DailySummaryGroup {
  date: Date
  commits: GitCommit[]
  formattedDate: string
  bulletPoints: string[]
  summaryText: string
}
```

### Action Result Types
```typescript
// File: src/types/actions.ts
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface FormState {
  message?: string
  errors?: Record<string, string[]>
}
```

## Zod Validation Schemas

### Input Validation
```typescript
// File: src/lib/validations/git.ts
import { z } from 'zod'
import { subDays } from 'date-fns'

export const FilterCriteriaSchema = z.object({
  author: z.string().min(1, "Author name is required").max(255).trim(),
  since: z.date()
    .max(new Date(), "Date cannot be in the future")
    .refine(
      date => date >= subDays(new Date(), 31),
      "Date must be within last 31 days"
    )
})

export const DailySummarySchema = z.object({
  authorName: z.string().min(1).max(255),
  summaryDate: z.date(),
  summaryText: z.string().min(1),
  repositoryUrl: z.string().url()
})
```

## Component Architecture

### Page Structure (App Router)
```
src/app/
├── page.tsx                    # Main Git log viewer page
├── components/
│   ├── GitFilterForm.tsx       # Client component with Server Actions
│   ├── GitCommitsList.tsx      # Server component
│   ├── DailySummariesView.tsx  # Server component
│   └── RefreshButton.tsx       # Client component with Server Action
├── lib/
│   ├── actions/
│   │   ├── git-actions.ts      # Server Actions for Git operations
│   │   └── summary-actions.ts  # Server Actions for summaries
│   ├── services/
│   │   ├── git/
│   │   │   ├── git-service.ts  # Git service interface
│   │   │   ├── real-git.ts     # Real Git implementation (simple-git)
│   │   │   └── mock-git.ts     # Mock Git implementation (for tests)
│   │   └── database.ts         # Database operations
│   └── validations/
│       └── git.ts              # Zod schemas
└── types/
    ├── git.ts                 # Core interfaces
    └── actions.ts             # Action result types
```

## Dependency Injection for Testing

### Git Service Interface
```typescript
// File: src/lib/services/git/git-service.ts
export interface GitService {
  getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]>
  validateRepository(path: string): Promise<boolean>
}

// Real implementation
// File: src/lib/services/git/real-git.ts
export class RealGitService implements GitService {
  async getCommits(author: string, since: Date, repositoryPath: string): Promise<GitCommit[]> {
    // Uses simple-git library for actual Git operations
  }
  
  async validateRepository(path: string): Promise<boolean> {
    // Check if path contains valid Git repository
  }
}

// Mock implementation for unit tests
// File: src/lib/services/git/mock-git.ts
export class MockGitService implements GitService {
  private mockCommits: GitCommit[] = []
  
  setMockCommits(commits: GitCommit[]) {
    this.mockCommits = commits
  }
  
  async getCommits(): Promise<GitCommit[]> {
    return this.mockCommits
  }
  
  async validateRepository(): Promise<boolean> {
    return true // Always valid for tests
  }
}
```

### Dependency Injection in Server Actions
```typescript
// File: src/lib/actions/git-actions.ts
'use server'

import { GitService } from '@/lib/services/git/git-service'
import { RealGitService } from '@/lib/services/git/real-git'

// Inject Git service (can be mocked for tests)
const gitService: GitService = new RealGitService()

export async function fetchGitCommits(
  formData: FormData,
  injectedGitService?: GitService // Optional for testing
): Promise<ActionResult<GitCommit[]>> {
  const service = injectedGitService || gitService
  // Use service.getCommits() instead of direct Git commands
}
```

## Benefits of Server Actions Approach

1. **Type Safety**: Full TypeScript integration without API layer
2. **Performance**: Direct server-side operations, no HTTP overhead
3. **Simplicity**: No need for separate API routes for internal operations
4. **Caching**: Automatic Next.js caching for Server Components
5. **Progressive Enhancement**: Forms work without JavaScript
6. **Security**: Server-side validation and operations

## Fallback API Routes (Optional)

If external API access is needed later, traditional API routes can be added:
- `/api/git/commits` - For external integrations
- `/api/summaries` - For mobile apps or external tools

This Server Actions approach aligns perfectly with modern Next.js App Router patterns and provides better performance and developer experience.
