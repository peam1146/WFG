# Tasks: shadcn/ui Migration and Component Replacement

**Input**: Design documents from `/Users/peam/work/me/WFG/specs/003-i-want-to/`
**Prerequisites**: plan.md ✅, research.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: TypeScript, Next.js, shadcn/ui, Radix UI, Tailwind CSS 4
   → Structure: Single Next.js project with App Router
2. Load design documents ✅:
   → research.md: Component mapping strategy and migration approach
3. Generate tasks by category ✅:
   → Setup: shadcn/ui initialization, component installation
   → Tests: Component testing, integration testing
   → Core: Component migration, replacement implementation
   → Integration: Component integration, functionality validation
   → Polish: Performance optimization, documentation
4. Apply task rules ✅:
   → Different files = mark [P] for parallel execution
   → Same file = sequential (no [P])
   → Tests before implementation (TDD approach)
5. Number tasks sequentially (T001-T025) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness ✅
9. Return: SUCCESS (tasks ready for execution) ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- Paths assume existing Next.js structure with App Router

## Phase 3.1: Setup

- [x] **T001** Initialize shadcn/ui in the project
  - Run `bunx shadcn-ui@latest init` from project root
  - Configure with TypeScript, default style, slate base color
  - Set CSS variables to true, use existing Tailwind config
  - Set component alias to `src/components`, utils to `src/lib/utils`
  - Verify `components.json` and `src/lib/utils.ts` are created

- [x] **T002** [P] Install core shadcn/ui components
  - Install Button: `bunx shadcn-ui@latest add button`
  - Install Input: `bunx shadcn-ui@latest add input`
  - Install Label: `bunx shadcn-ui@latest add label`
  - Install Card: `bunx shadcn-ui@latest add card`
  - Install Badge: `bunx shadcn-ui@latest add badge`
  - Verify components created in `src/components/ui/`

- [x] **T003** [P] Install additional shadcn/ui components
  - Install Alert: `bunx shadcn-ui@latest add alert`
  - Install Form: `bunx shadcn-ui@latest add form`
  - Install Select: `bunx shadcn-ui@latest add select`
  - Install Progress: `bunx shadcn-ui@latest add progress`
  - Install Skeleton: `bunx shadcn-ui@latest add skeleton`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] **T004** [P] Component integration test for RefreshButton in `src/__tests__/components/RefreshButton.test.tsx`
  - Test RefreshButton renders with shadcn/ui Button component ✅
  - Test loading state functionality ✅
  - Test click handler preservation ✅
  - Test accessibility attributes ✅

- [x] **T005** [P] Component integration test for LoadingSpinner in `src/__tests__/components/LoadingSpinner.test.tsx`
  - Test LoadingSpinner renders with shadcn/ui Skeleton component ✅
  - Test different loading states ✅
  - Test accessibility compliance ✅
  - Test animation behavior ✅

- [x] **T006** [P] Component integration test for ErrorBoundary in `src/__tests__/components/ErrorBoundary.test.tsx`
  - Test ErrorBoundary renders with shadcn/ui Alert component ✅
  - Test error state display ✅
  - Test error recovery functionality ✅
  - Test accessibility features ✅

- [x] **T007** [P] Component integration test for AIStatusIndicator in `src/__tests__/components/AIStatusIndicator.test.tsx`
  - Test AIStatusIndicator renders with shadcn/ui Badge and Alert ✅
  - Test different status states ✅
  - Test status change animations ✅
  - Test accessibility compliance ✅

- [x] **T008** [P] Component integration test for GitFilterForm in `src/__tests__/components/GitFilterForm.test.tsx`
  - Test GitFilterForm renders with shadcn/ui form components ✅
  - Test form submission functionality ✅
  - Test input validation ✅
  - Test accessibility and keyboard navigation ✅

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] **T009** [P] Migrate RefreshButton component in `src/components/RefreshButton.tsx`
  - Replace custom button with shadcn/ui Button component ✅
  - Maintain existing props interface ✅
  - Preserve loading state functionality ✅
  - Maintain click handlers and disabled states ✅
  - Update imports and exports ✅

- [x] **T010** [P] Migrate LoadingSpinner component in `src/components/LoadingSpinner.tsx`
  - Replace custom spinner with shadcn/ui Skeleton component ✅
  - Maintain existing props interface ✅
  - Preserve animation and timing ✅
  - Update styling to match design system ✅
  - Update imports and exports ✅

- [x] **T011** [P] Migrate ErrorBoundary component in `src/components/ErrorBoundary.tsx`
  - Replace custom error display with shadcn/ui Alert component ✅
  - Maintain existing error handling logic ✅
  - Preserve error recovery functionality ✅
  - Update styling and accessibility ✅
  - Update imports and exports ✅

- [x] **T012** Migrate AIStatusIndicator component in `src/components/AIStatusIndicator.tsx`
  - Replace custom indicators with shadcn/ui Badge and Alert components ✅
  - Maintain existing status logic ✅
  - Preserve color coding and status display ✅
  - Update accessibility features ✅
  - Update imports and exports ✅

- [x] **T013** Migrate FormValidation component in `src/components/FormValidation.tsx`
  - Integrate with shadcn/ui Form, Input, and Label components ✅
  - Maintain existing validation logic ✅
  - Preserve error display functionality ✅
  - Update styling to match design system ✅
  - Update imports and exports ✅

- [x] **T014** Migrate GitCommitsList component in `src/components/GitCommitsList.tsx`
  - Replace custom cards with shadcn/ui Card components ✅
  - Replace custom badges with shadcn/ui Badge components ✅
  - Maintain existing commit display logic ✅
  - Preserve Git data formatting ✅
  - Update imports and exports ✅

## Phase 3.4: Integration

- [x] **T015** Migrate GitFilterForm component in `src/components/GitFilterForm.tsx`
  - Replace form elements with shadcn/ui Button, Input, Label, Card ✅
  - Maintain existing form submission logic ✅
  - Preserve validation and error handling ✅
  - Update styling and accessibility ✅
  - Update imports and exports ✅

- [x] **T016** Migrate DailySummariesView component in `src/components/DailySummariesView.tsx`
  - Replace custom cards with shadcn/ui Card components ✅
  - Replace AI indicators with shadcn/ui Badge components ✅
  - Maintain existing summary display logic ✅
  - Preserve AI enhancement features ✅
  - Update imports and exports ✅

- [x] **T017** Update component imports across the application
  - Update imports in all pages and components that use migrated components ✅
  - Verify no circular dependencies introduced ✅
  - Update TypeScript interfaces if needed ✅
  - Ensure all components export correctly ✅

- [x] **T018** Validate component functionality integration
  - Test GitFilterForm with author input and date selection ✅
  - Verify DailySummariesView displays summaries correctly ✅
  - Check AI enhancement features still work ✅
  - Test all component interactions and state management ✅

## Phase 3.5: Polish

- [x] **T019** [P] Run accessibility validation tests
  - Test keyboard navigation through all components ✅
  - Verify ARIA labels and screen reader compatibility ✅
  - Check color contrast meets WCAG guidelines ✅
  - Validate focus management and tab order ✅

- [x] **T020** [P] Performance optimization and validation
  - Run build process and measure bundle size changes ✅
  - Test page load times and runtime performance ✅
  - Verify tree-shaking is working correctly ✅
  - Optimize imports for better performance ✅

- [x] **T021** [P] Update component documentation in `docs/components.md`
  - Document new shadcn/ui component usage patterns ✅
  - Update component API documentation ✅
  - Include accessibility guidelines ✅
  - Add migration notes and best practices ✅

- [x] **T022** Clean up and remove old component artifacts
  - Remove any unused custom component files ✅
  - Clean up old CSS classes and styles ✅
  - Remove deprecated imports and references ✅
  - Update package.json if needed ✅

- [x] **T023** Cross-browser compatibility testing
  - Test in Chrome, Firefox, Safari, and Edge ✅
  - Verify component rendering consistency ✅
  - Test accessibility features across browsers ✅
  - Document any browser-specific issues ✅

- [x] **T024** End-to-end functionality validation
  - Test complete Git worklog workflow ✅
  - Verify commit filtering with new UI components ✅
  - Test summary generation and display ✅
  - Validate AI enhancement features (if configured) ✅

- [x] **T025** Final integration and deployment preparation
  - Run full test suite and ensure all tests pass ✅
  - Create production build and test ✅
  - Update README.md with shadcn/ui information ✅
  - Prepare deployment with new component library ✅

## Dependencies

**Critical Path**:
- T001 (shadcn/ui init) → T002-T003 (component installation) → T004-T008 (tests) → T009-T016 (implementation)
- T017-T018 (integration) → T019-T025 (polish and validation)

**Blocking Dependencies**:
- T001 MUST complete before T002-T003
- T002-T003 MUST complete before T004-T008
- T004-T008 MUST complete and FAIL before T009-T016
- T009-T014 (simple components) before T015-T016 (complex components)
- T017 (imports) after all component migrations (T009-T016)
- T018 (validation) after T017 (imports)

**Parallel Execution Safe**:
- T002, T003 can run together (different component installations)
- T004-T008 can run together (different test files)
- T009-T011 can run together (different component files)
- T019-T021 can run together (different validation types)
- T023-T024 can run together (different testing scenarios)

## Parallel Example
```bash
# Launch T004-T008 together (Test Phase):
Task: "Component integration test for RefreshButton in src/__tests__/components/RefreshButton.test.tsx"
Task: "Component integration test for LoadingSpinner in src/__tests__/components/LoadingSpinner.test.tsx"
Task: "Component integration test for ErrorBoundary in src/__tests__/components/ErrorBoundary.test.tsx"
Task: "Component integration test for AIStatusIndicator in src/__tests__/components/AIStatusIndicator.test.tsx"
Task: "Component integration test for GitFilterForm in src/__tests__/components/GitFilterForm.test.tsx"

# Launch T009-T011 together (Simple Component Migration):
Task: "Migrate RefreshButton component in src/components/RefreshButton.tsx"
Task: "Migrate LoadingSpinner component in src/components/LoadingSpinner.tsx"
Task: "Migrate ErrorBoundary component in src/components/ErrorBoundary.tsx"

# Launch T019-T021 together (Polish Phase):
Task: "Run accessibility validation tests"
Task: "Performance optimization and validation"
Task: "Update component documentation in docs/components.md"
```

## Notes
- [P] tasks = different files, no dependencies between them
- Verify tests fail before implementing (TDD approach)
- Commit after each component migration
- Maintain existing functionality throughout migration
- Follow constitutional requirements for MCP shadcn server usage

## Task Generation Rules Applied

1. **From Research Document**:
   - Component mapping table → individual migration tasks (T009-T016)
   - Installation requirements → setup tasks (T001-T003)
   - Testing strategy → test tasks (T004-T008)
   
2. **From Plan Technical Context**:
   - TypeScript + Next.js → component-specific tasks
   - Performance goals → optimization tasks (T020)
   - Accessibility requirements → validation tasks (T019)
   
3. **From Component Analysis**:
   - 8 components identified → 8 migration tasks
   - Complexity levels → task ordering (simple first)
   - Integration requirements → integration tasks (T017-T018)

## Validation Checklist
*GATE: Checked before task execution*

- [x] All components have migration tasks (T009-T016)
- [x] All components have integration tests (T004-T008)
- [x] All tests come before implementation (T004-T008 before T009-T016)
- [x] Parallel tasks are truly independent (different files/components)
- [x] Each task specifies exact file path or command
- [x] No task modifies same file as another [P] task
- [x] Setup tasks precede all other work (T001-T003)
- [x] Polish tasks come after implementation (T019-T025)

---

**Tasks Complete**: 25 numbered, ordered tasks ready for execution following TDD and constitutional principles.
