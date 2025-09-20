# Tasks: Git Log Viewer with Daily Summaries

**Input**: Design documents from `/Users/peam/work/me/WFG/specs/001-create-web-site/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Next.js 14.0.4, Bun v1.2.19, TypeScript, Tailwind CSS 4.1.13
   → Structure: Next.js App Router with Server Actions
2. Load design documents ✅:
   → data-model.md: DailySummary entity, GitCommit interface
   → contracts/: Server Actions (fetchGitCommits, generateSummaries, refreshSummaries)
   → research.md: Prisma + SQLite, simple-git, Jest testing, dependency injection
3. Generate tasks by category: Setup → Tests → Core → Integration → Polish
4. Apply task rules: Server Actions = sequential, different services = [P]
5. Number tasks sequentially (T001, T002...)
6. TDD approach: Tests before implementation
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All paths relative to `/Users/peam/work/me/WFG/`

## Phase 3.1: Setup & Dependencies

- [x] **T001** Install and configure Prisma ORM with SQLite in `prisma/schema.prisma`
- [x] **T002** [P] Install Git integration dependencies (simple-git, date-fns with Thai locale)
- [x] **T003** [P] Configure Jest testing environment with Bun compatibility
- [x] **T004** [P] Set up TypeScript interfaces in `src/types/git.ts` and `src/types/actions.ts`
- [x] **T005** Create Prisma DailySummary model and run initial migration

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Server Actions)
- [x] **T006** [P] Contract test fetchGitCommits Server Action in `src/__tests__/actions/git-actions.test.ts`
- [x] **T007** [P] Contract test generateSummaries Server Action in `src/__tests__/actions/summary-actions.test.ts`
- [x] **T008** [P] Contract test refreshSummaries Server Action in `src/__tests__/actions/summary-actions.test.ts`

### Integration Tests (User Stories)
- [x] **T009** [P] Integration test: Basic Git log filtering in `src/__tests__/integration/git-filtering.test.ts`
- [x] **T010** [P] Integration test: Database summary persistence in `src/__tests__/integration/summary-persistence.test.ts`
- [x] **T011** [P] Integration test: Summary refresh functionality in `src/__tests__/integration/summary-refresh.test.ts`
- [x] **T012** [P] Integration test: Multiple commits same day grouping in `src/__tests__/integration/daily-grouping.test.ts`

### Service Layer Tests
- [x] **T013** [P] Unit test: GitService interface with mock implementation in `src/__tests__/services/git-service.test.ts`
- [x] **T014** [P] Unit test: Database operations for DailySummary in `src/__tests__/services/database.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Service Layer (Dependency Injection)
- [x] **T015** [P] Create GitService interface in `src/lib/services/git/git-service.ts`
- [x] **T016** [P] Implement RealGitService using simple-git in `src/lib/services/git/real-git.ts`
- [x] **T017** [P] Implement MockGitService for testing in `src/lib/services/git/mock-git.ts`
- [x] **T018** [P] Create database service for DailySummary operations in `src/lib/services/database.ts`

### Validation & Schemas
- [x] **T019** [P] Create Zod validation schemas in `src/lib/validations/git.ts`
- [x] **T020** [P] Implement date formatting utilities with Thai locale in `src/lib/utils/date-formatter.ts`

### Server Actions Implementation
- [x] **T021** Implement fetchGitCommits Server Action in `src/lib/actions/git-actions.ts`
- [x] **T022** Implement generateSummaries Server Action in `src/lib/actions/summary-actions.ts`
- [x] **T023** Implement refreshSummaries Server Action in `src/lib/actions/summary-actions.ts`

### React Components
- [x] **T024** [P] Create GitFilterForm client component in `src/components/GitFilterForm.tsx`
- [x] **T025** [P] Create GitCommitsList Server Component in `src/components/GitCommitsList.tsx`
- [x] **T026** [P] Create DailySummariesView Server Component in `src/components/DailySummariesView.tsx`
- [x] **T027** [P] Create RefreshButton client component in `src/components/RefreshButton.tsx`

### Main Page Integration
- [x] **T028** Update main page to integrate all components in `src/app/page.tsx`

## Phase 3.4: Integration & Configuration

- [x] **T029** Configure environment variables for Git repository path in `docs/environment-configuration.md`
- [x] **T030** Set up error handling and logging across Server Actions
- [x] **T031** Implement proper loading states and error boundaries
- [x] **T032** Add form validation and user feedback messages

## Phase 3.5: Polish & Performance

- [x] **T033** [P] Add unit tests for date formatting utilities in `src/__tests__/utils/date-formatter.test.ts`
- [x] **T034** [P] Add unit tests for validation schemas in `src/__tests__/validations/git.test.ts`
- [x] **T035** Performance optimization: Implement proper caching for Server Components
- [x] **T036** [P] Add comprehensive error handling with custom error classes
- [x] **T037** [P] Update project documentation and README
- [x] **T038** Run quickstart validation tests from `quickstart.md`

## Dependencies

**Setup Phase**:
- T001 (Prisma) → T005 (migration)
- T004 (TypeScript interfaces) → All implementation tasks

**Testing Phase**:
- T006-T014 MUST complete before T015-T038
- All contract tests must fail before implementation

**Implementation Phase**:
- T015 (GitService interface) → T016, T017 (implementations)
- T018 (database service) → T022, T023 (summary actions)
- T019 (validation) → T021-T023 (Server Actions)
- T021-T023 (Server Actions) → T024-T027 (components)
- T024-T027 (components) → T028 (page integration)

**Integration Phase**:
- T028 (page integration) → T029-T032 (configuration)

## Parallel Execution Examples

### Setup Phase (can run together):
```bash
# T002, T003, T004 can run in parallel
Task: "Install Git integration dependencies (simple-git, date-fns with Thai locale)"
Task: "Configure Jest testing environment with Bun compatibility"
Task: "Set up TypeScript interfaces in src/types/git.ts and src/types/actions.ts"
```

### Contract Tests Phase (can run together):
```bash
# T006-T014 can run in parallel (different test files)
Task: "Contract test fetchGitCommits Server Action in src/__tests__/actions/git-actions.test.ts"
Task: "Contract test generateSummaries Server Action in src/__tests__/actions/summary-actions.test.ts"
Task: "Integration test: Basic Git log filtering in src/__tests__/integration/git-filtering.test.ts"
Task: "Unit test: GitService interface with mock implementation in src/__tests__/services/git-service.test.ts"
```

### Service Implementation Phase (can run together):
```bash
# T015-T020 can run in parallel (different service files)
Task: "Create GitService interface in src/lib/services/git/git-service.ts"
Task: "Implement RealGitService using simple-git in src/lib/services/git/real-git.ts"
Task: "Create database service for DailySummary operations in src/lib/services/database.ts"
Task: "Create Zod validation schemas in src/lib/validations/git.ts"
```

### Component Implementation Phase (can run together):
```bash
# T024-T027 can run in parallel (different component files)
Task: "Create GitFilterForm client component in src/components/GitFilterForm.tsx"
Task: "Create GitCommitsList Server Component in src/components/GitCommitsList.tsx"
Task: "Create DailySummariesView Server Component in src/components/DailySummariesView.tsx"
Task: "Create RefreshButton client component in src/components/RefreshButton.tsx"
```

## Notes

- **Server Actions** (T021-T023) must be sequential as they may share validation logic
- **[P] tasks** target different files with no shared dependencies
- **TDD Approach**: All tests must fail before implementing corresponding functionality
- **Dependency Injection**: Use GitService interface for easy testing and mocking
- **Thai Date Format**: Ensure proper locale support for "18 ส.ค. 2568" format
- **Performance**: 31-day limit enforced in validation, database caching for summaries

## Validation Checklist

- [x] All Server Actions have corresponding contract tests (T006-T008)
- [x] All entities have model/service tasks (T005, T018)
- [x] All tests come before implementation (Phase 3.2 → 3.3)
- [x] Parallel tasks target different files ([P] marked appropriately)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Integration tests cover all user stories from quickstart.md
- [x] Dependency injection pattern implemented for testability
