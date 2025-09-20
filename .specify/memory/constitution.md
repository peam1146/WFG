<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.1.1
- Modified sections: UI Component Library Standards (added MCP guidance)
- Added guidance: Use MCP shadcn server for latest component information
- Technology stack: Bun + Next.js + Tailwind 4 + shadcn/ui (unchanged)
- Templates requiring updates: ✅ No template changes required
- Follow-up TODOs: None
-->

# WFG Constitution

## Core Principles

### I. Modern Stack First

All development MUST use the established technology stack: Bun as runtime and package manager, Next.js as React framework, Tailwind 4 for styling, and shadcn/ui for component library. No alternative technologies without explicit justification and approval. CLI tools (bun, bunx) are preferred for initialization and package management over manual configuration.

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
- **UI Components**: shadcn/ui (latest stable)
- **Package Manager**: Bun (no npm/yarn/pnpm)

### UI Component Library Standards

- **Primary Library**: shadcn/ui MUST be used for all UI components
- **Installation**: Use `bunx shadcn-ui@latest init` for setup and `bunx shadcn-ui@latest add [component]` for individual components
- **Documentation Access**: Use MCP shadcn server to get latest component information, usage examples, and best practices before implementation
- **Component Research**: Query MCP for component availability, props interfaces, and integration patterns
- **Customization**: Components may be customized but MUST maintain accessibility standards
- **Consistency**: All custom components MUST be replaced with shadcn/ui equivalents where available
- **Accessibility**: shadcn/ui components provide built-in accessibility features that MUST be preserved

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

**Version**: 1.1.1 | **Ratified**: 2025-09-20 | **Last Amended**: 2025-09-20