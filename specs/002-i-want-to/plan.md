
# Implementation Plan: AI-Enhanced Worklog Summarization

**Branch**: `002-i-want-to` | **Date**: 2025-09-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-i-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Enhance existing WFG worklog summarization with AI-powered contextual summaries using Vercel AI SDK and OpenRouter integration. System must maintain backward compatibility while providing intelligent, readable summaries that transform technical Git commits into coherent work narratives.

## Technical Context
**Language/Version**: TypeScript with Next.js 14 (existing stack)  
**Primary Dependencies**: Vercel AI SDK, OpenRouter API, existing simple-git, Prisma ORM  
**Storage**: SQLite (existing) with new AI summary caching table  
**Testing**: Jest (existing) with new AI integration tests  
**Target Platform**: Desktop-first web application (existing)
**Project Type**: web - extends existing Next.js application  
**Performance Goals**: <2s AI summary generation, graceful fallback to existing summaries  
**Constraints**: API rate limits, token limits, privacy (no persistent external storage)  
**Scale/Scope**: Single user worklog tool, 31-day commit history, configurable AI models

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Modern Stack First**: ✅ PASS
- Uses existing Bun + Next.js + Tailwind 4 stack
- Adds Vercel AI SDK (compatible with Next.js ecosystem)
- No alternative technologies introduced

**II. Git-Centric Workflow**: ✅ PASS  
- Enhances core Git worklog functionality
- Maintains existing Git integration reliability
- Improves Git commit interpretation and presentation

**III. Desktop-First Experience**: ✅ PASS
- Extends existing desktop-optimized interface
- No mobile-specific features added
- Maintains productivity focus for developers

**IV. Performance & Efficiency**: ⚠️ REVIEW
- AI API calls may introduce latency (<2s target)
- Caching strategy mitigates performance impact
- Fallback to existing fast summaries ensures baseline performance

**V. Developer Experience**: ✅ PASS
- Maintains existing hot reload and build speed
- Environment-based configuration (no UI complexity)
- Backward compatible (no workflow disruption)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1 (Single project) - Extending existing Next.js application structure

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh windsurf` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- AI Service contract → contract test task [P]
- AI entities (AISummary, AIModelConfiguration, APIUsageTracking) → model creation tasks [P]
- Database migration → schema update task
- Enhanced Server Actions → implementation tasks
- Integration tests for AI workflow → test tasks
- Fallback behavior → error handling tasks

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Database schema → Models → Services → Server Actions → UI integration
- Mark [P] for parallel execution (independent files)
- AI-specific tasks can run parallel to existing system enhancements

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**Key Task Categories**:
1. **Database Extension** (Tasks 1-3): Schema migration, new tables, indexes
2. **AI Service Integration** (Tasks 4-8): Vercel AI SDK setup, OpenRouter configuration, service layer
3. **Enhanced Server Actions** (Tasks 9-12): Extend existing actions with AI capabilities
4. **Error Handling & Fallback** (Tasks 13-15): Graceful degradation, logging, monitoring
5. **Testing & Validation** (Tasks 16-20): Contract tests, integration tests, performance validation
6. **Documentation & Configuration** (Tasks 21-25): Environment setup, deployment guides, troubleshooting

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
