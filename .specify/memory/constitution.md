<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- New constitution for WFG (Worklog From Git) project
- Technology stack: Bun + Next.js + Tailwind 4
- Templates requiring updates: ✅ Initial setup
- Follow-up TODOs: None
-->

# WFG Constitution

## Core Principles

### I. Modern Stack First

All development MUST use the established technology stack: Bun as runtime and package manager, Next.js as React framework, Tailwind 4 for styling. No alternative technologies without explicit justification and approval. CLI tools (bun, bunx) are preferred for initialization and package management over manual configuration.

### II. Git-Centric Workflow

The application's core purpose is to generate worklogs from Git history. All features MUST enhance or support this primary function. Git integration is non-negotiable and must be reliable, performant, and accurate.

### III. Desktop-First Experience

User interface MUST be optimized for desktop usage with responsive design principles. Mobile compatibility is secondary. Focus on productivity features suitable for developers reviewing their work history.

### IV. Performance & Efficiency

Leverage Bun's performance advantages throughout the stack. Bundle sizes must be minimized, load times optimized, and Git operations must be efficient even with large repositories.

### V. Developer Experience

Development workflow must prioritize speed and simplicity. Hot reload, fast builds, and clear error messages are mandatory. Documentation must be comprehensive and up-to-date.

## Technology Standards

### Required Stack

- **Runtime**: Bun (latest stable)
- **Framework**: Next.js (latest stable with App Router)
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: Bun (no npm/yarn/pnpm)

### Code Quality

- TypeScript is mandatory for type safety
- ESLint and Prettier configurations must be maintained
- Component-based architecture with clear separation of concerns
- Consistent naming conventions following Next.js best practices

## Development Workflow

### Setup Requirements

- Use CLI tools (bun create, bunx) for project initialization
- Read official documentation via context7 MCP before implementation
- No manual package.json editing without understanding dependencies
- Environment-specific configurations for dev, test, and production

### Git Integration Standards

- Git operations must be secure and read-only by default
- Support for multiple repository formats and structures
- Efficient parsing of Git history and metadata
- Clear error handling for Git-related operations

## Governance

This constitution supersedes all other development practices. All code changes must align with these principles. Amendments require documentation of rationale and impact assessment.

**Version**: 1.0.0 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-09-20