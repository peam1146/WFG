# Tasks: AI-Enhanced Worklog Summarization

**Input**: Design documents from `/specs/002-i-want-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Next.js 14, Vercel AI SDK, OpenRouter
   → Structure: Single project extending existing WFG application
2. Load design documents:
   → data-model.md: 3 entities (AISummary, AIModelConfiguration, APIUsageTracking)
   → contracts/: AI Server Actions with backward compatibility
   → research.md: Vercel AI SDK integration patterns
3. Generate tasks by category:
   → Setup: Dependencies, environment, database migration
   → Tests: Contract tests, integration tests for AI workflow
   → Core: AI service, enhanced server actions, database models
   → Integration: Caching, error handling, fallback mechanisms
   → Polish: Performance tests, documentation, validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → Database schema before models
5. Number tasks sequentially (T001-T025)
6. SUCCESS: Tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Dependencies

- [x] **T001** Install AI dependencies: `bun add ai @ai-sdk/openai` for Vercel AI SDK integration
- [x] **T002** [P] Update environment configuration template in `docs/environment-configuration.md` with AI-specific variables
- [x] **T003** Create database migration script in `prisma/migrations/002_add_ai_tables.sql` for AI summary tables

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T004** [P] Contract test for `generateAISummaries` Server Action in `src/__tests__/actions/ai-actions.test.ts`
- [x] **T005** [P] Contract test for `refreshAISummaries` Server Action in `src/__tests__/actions/ai-refresh.test.ts`
- [x] **T006** [P] Contract test for `getAIModelStatus` Server Action in `src/__tests__/actions/ai-status.test.ts`
- [x] **T007** [P] Integration test for AI summary generation workflow in `src/__tests__/integration/ai-summarization.test.ts`
- [x] **T008** [P] Integration test for AI service fallback behavior in `src/__tests__/integration/ai-fallback.test.ts`
- [x] **T009** [P] Integration test for AI cache invalidation on refresh in `src/__tests__/integration/ai-cache-refresh.test.ts`

## Phase 3.3: Database & Models (ONLY after tests are failing)

- [x] **T010** Update Prisma schema in `prisma/schema.prisma` with AI summary tables (AISummary, AIModelConfiguration, APIUsageTracking)
- [x] **T011** Run database migration: `bun run db:migrate` to create AI tables
- [x] **T012** [P] Create AISummary model interface in `src/types/ai.ts`
- [x] **T013** [P] Create AIModelConfiguration model interface in `src/types/ai-config.ts`
- [x] **T014** [P] Create APIUsageTracking model interface in `src/types/api-usage.ts`

## Phase 3.4: Core AI Implementation

- [x] **T015** Create AI service interface in `src/lib/services/ai/ai-service.ts` with OpenRouter integration
- [x] **T016** [P] Create AI service implementation in `src/lib/services/ai/openrouter-ai.ts` using Vercel AI SDK
- [x] **T017** [P] Create AI service mock for testing in `src/lib/services/ai/mock-ai.ts`
- [x] **T018** Extend database service in `src/lib/services/database.ts` with AI summary operations
- [x] **T019** Create AI configuration service in `src/lib/services/ai-config.ts` for model management
- [x] **T020** Enhance existing `generateSummaries` Server Action in `src/lib/actions/summary-actions.ts` with AI integration

## Phase 3.5: Enhanced Server Actions

- [x] **T021** Create `generateAISummaries` Server Action in `src/lib/actions/ai-actions.ts`
- [x] **T022** Create `refreshAISummaries` Server Action in `src/lib/actions/ai-refresh-actions.ts`
- [x] **T023** Create `getAIModelStatus` Server Action in `src/lib/actions/ai-status-actions.ts`

## Phase 3.6: Error Handling & Integration

- [x] **T024** Extend error handler in `src/lib/utils/error-handler.ts` with AI-specific error types
- [x] **T025** Extend logger in `src/lib/utils/logger.ts` with AI operation logging methods
- [x] **T026** Update cache utilities in `src/lib/utils/cache.ts` with AI summary caching
- [x] **T027** Create AI prompt templates in `src/lib/prompts/summary-prompts.ts`

## Phase 3.7: UI Integration (Backward Compatible)

- [x] **T028** Update DailySummariesView component in `src/components/DailySummariesView.tsx` to display AI-enhanced summaries
- [x] **T029** [P] Add AI status indicator component in `src/components/AIStatusIndicator.tsx`
- [x] **T030** [P] Update loading states in existing components for AI generation delays

## Phase 3.8: Polish & Performance

- [x] **T031** [P] Add unit tests for AI prompt generation in `src/__tests__/unit/prompt-generation.test.ts`
- [x] **T032** [P] Add unit tests for AI configuration management in `src/__tests__/unit/ai-config.test.ts`
- [x] **T033** Performance test: AI summary generation under 3 seconds in `src/__tests__/performance/ai-performance.test.ts`
- [x] **T034** [P] Update project README.md with AI enhancement documentation
- [x] **T035** [P] Create troubleshooting guide in `docs/ai-troubleshooting.md`
- [ ] **T036** Run quickstart validation tests from `specs/002-i-want-to/quickstart.md`

## Dependencies

**Critical Path**:
- T001-T003 (Setup) → T004-T009 (Tests) → T010-T011 (Database) → T012-T014 (Models)
- T015-T019 (AI Services) → T020-T023 (Server Actions) → T024-T027 (Integration)
- T028-T030 (UI) → T031-T036 (Polish)

**Blocking Dependencies**:
- T010 (Prisma schema) blocks T011 (migration) and T012-T014 (models)
- T015 (AI service interface) blocks T016-T017 (implementations)
- T018 (database service) blocks T020-T023 (server actions)
- T004-T009 (tests) must fail before T015-T030 (implementation)

## Parallel Execution Examples

### Phase 3.2: Tests (All Parallel)
```bash
# Launch T004-T009 together:
Task: "Contract test for generateAISummaries in src/__tests__/actions/ai-actions.test.ts"
Task: "Contract test for refreshAISummaries in src/__tests__/actions/ai-refresh.test.ts"
Task: "Contract test for getAIModelStatus in src/__tests__/actions/ai-status.test.ts"
Task: "Integration test AI summary workflow in src/__tests__/integration/ai-summarization.test.ts"
Task: "Integration test AI fallback in src/__tests__/integration/ai-fallback.test.ts"
Task: "Integration test AI cache refresh in src/__tests__/integration/ai-cache-refresh.test.ts"
```

### Phase 3.3: Models (After Database Migration)
```bash
# Launch T012-T014 together:
Task: "Create AISummary model interface in src/types/ai.ts"
Task: "Create AIModelConfiguration model interface in src/types/ai-config.ts"
Task: "Create APIUsageTracking model interface in src/types/api-usage.ts"
```

### Phase 3.4: AI Services (After Interface)
```bash
# Launch T016-T017 together:
Task: "Create AI service implementation in src/lib/services/ai/openrouter-ai.ts"
Task: "Create AI service mock in src/lib/services/ai/mock-ai.ts"
```

### Phase 3.7: UI Components
```bash
# Launch T029-T030 together:
Task: "Add AI status indicator component in src/components/AIStatusIndicator.tsx"
Task: "Update loading states in existing components for AI generation delays"
```

### Phase 3.8: Polish & Documentation
```bash
# Launch T031-T032, T034-T035 together:
Task: "Unit tests for AI prompt generation in src/__tests__/unit/prompt-generation.test.ts"
Task: "Unit tests for AI configuration in src/__tests__/unit/ai-config.test.ts"
Task: "Update project README.md with AI enhancement documentation"
Task: "Create troubleshooting guide in docs/ai-troubleshooting.md"
```

## Task Validation Checklist

**Contract Coverage**:
- [x] generateAISummaries → T004 contract test
- [x] refreshAISummaries → T005 contract test  
- [x] getAIModelStatus → T006 contract test

**Entity Coverage**:
- [x] AISummary → T012 model interface
- [x] AIModelConfiguration → T013 model interface
- [x] APIUsageTracking → T014 model interface

**Integration Coverage**:
- [x] AI workflow → T007 integration test
- [x] Fallback behavior → T008 integration test
- [x] Cache refresh → T009 integration test

**TDD Compliance**:
- [x] All tests (T004-T009) before implementation (T015+)
- [x] Database schema (T010) before models (T012-T014)
- [x] Services (T015-T019) before Server Actions (T020-T023)

## Notes

- **Backward Compatibility**: All changes extend existing functionality without breaking changes
- **Graceful Fallback**: AI failures fall back to existing basic summarization
- **Environment Driven**: AI features controlled via environment variables
- **Performance**: AI generation cached until explicit refresh
- **Privacy**: No persistent external storage of commit content
- **Testing**: Comprehensive test coverage including error scenarios

## Estimated Timeline

- **Setup & Tests**: 2-3 days (T001-T009)
- **Core Implementation**: 4-5 days (T010-T027)  
- **UI Integration**: 1-2 days (T028-T030)
- **Polish & Validation**: 2-3 days (T031-T036)
- **Total**: 9-13 days for complete implementation

**Ready for implementation following TDD principles with comprehensive test coverage.**
