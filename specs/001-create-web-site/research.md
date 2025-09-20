# Research: Git Log Viewer with Daily Summaries

**Feature**: Git Log Viewer with Daily Summaries  
**Date**: 2025-09-20  
**Status**: Complete

## Research Tasks Completed

### 1. Database ORM Selection for Next.js + Bun

**Decision**: Prisma ORM  
**Rationale**: 
- Excellent TypeScript support with type-safe queries
- Native Bun compatibility and performance optimizations
- Strong Next.js integration with API routes
- Automatic migration generation and schema management
- Active community and comprehensive documentation

**Alternatives considered**:
- Drizzle ORM: Good performance but less mature ecosystem
- TypeORM: Heavy and complex for simple use case
- Raw SQL: No type safety, more maintenance overhead

### 2. Git Integration Library

**Decision**: Simple Git (simple-git npm package)  
**Rationale**:
- Lightweight wrapper around Git CLI commands
- Promise-based API perfect for async operations
- Excellent TypeScript definitions
- Handles authentication and error scenarios well
- Widely used in Node.js/Bun environments

**Alternatives considered**:
- NodeGit: Native bindings but complex setup and larger bundle
- Git CLI direct: Manual command construction and parsing
- Isomorphic-git: Browser-focused, overkill for server-side use

### 3. Testing Strategy for Git Operations

**Decision**: Jest with dependency injection and mocked Git service  
**Rationale**:
- **Unit Tests**: Mock Git service via dependency injection (no actual Git commands)
- **Integration Tests**: Real Git operations with temporary test repositories
- **Service Layer**: Abstract Git operations behind interface for easy mocking
- Bun has excellent Jest compatibility with fast test execution

**Implementation Pattern**:
```typescript
// Git service interface for dependency injection
interface GitService {
  getCommits(author: string, since: Date): Promise<GitCommit[]>
}

// Real implementation
class RealGitService implements GitService { /* uses simple-git */ }

// Mock implementation for tests
class MockGitService implements GitService { /* returns test data */ }
```

**Alternatives considered**:
- Direct Git CLI mocking: Complex and brittle
- Vitest: Good but Jest has better mocking ecosystem
- Only integration tests: Slower feedback loop for unit tests

### 4. Date Handling for Thai Locale

**Decision**: date-fns with Thai locale support  
**Rationale**:
- Lightweight and tree-shakeable
- Excellent Thai locale support (th locale)
- Immutable date operations
- Perfect for formatting "18 ส.ค. 2568" style dates

**Alternatives considered**:
- Moment.js: Deprecated and heavy bundle size
- Native Intl: Limited Thai Buddhist calendar support
- Day.js: Smaller but less comprehensive locale support

### 5. Database Choice

**Decision**: SQLite with better-sqlite3  
**Rationale**:
- Zero configuration for development
- File-based storage perfect for single-user tool
- Excellent Bun performance with better-sqlite3
- Easy backup and portability
- Can upgrade to PostgreSQL later if needed

**Alternatives considered**:
- PostgreSQL: Overkill for single-user desktop app
- MySQL: Unnecessary complexity for this use case
- In-memory: Data persistence required

### 6. Error Handling Strategy

**Decision**: Custom error classes with user-friendly messages  
**Rationale**:
- GitError, DatabaseError, ValidationError classes
- Centralized error handling in API routes
- User-friendly error messages as per requirements
- Proper logging for debugging

**Alternatives considered**:
- Generic Error objects: Less structured error handling
- Third-party error libraries: Unnecessary complexity

## Technical Decisions Summary

| Component | Choice | Key Benefit |
|-----------|--------|-------------|
| Database | SQLite + Prisma | Zero config, type safety |
| Git Integration | simple-git | Lightweight, reliable |
| Testing | Jest + fixtures | Comprehensive coverage |
| Date Formatting | date-fns + Thai locale | Proper Thai date support |
| Error Handling | Custom error classes | User-friendly messages |

## Implementation Notes

- All choices align with WFG Constitution (Bun + Next.js + TypeScript)
- Performance optimized with 31-day limit and database caching
- Desktop-first approach with responsive design
- Clear separation of concerns: UI components, API routes, Git services, database models

## Next Phase

Ready for Phase 1: Design & Contracts with all technical unknowns resolved.
