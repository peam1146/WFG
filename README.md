# WFG - Worklog From Git

A modern Git log viewer with **AI-enhanced daily summaries** featuring Thai Buddhist calendar support. Built with Next.js 14, Server Actions, and TypeScript.

## ✨ Features

### Core Features
- **Git Commit Filtering**: Filter commits by author and date range (last 31 days)
- **Daily Summaries**: Automatically generate daily work summaries from Git commits
- **Thai Buddhist Calendar**: Display dates in Thai format (e.g., "20 ก.ย. 2568")
- **Real-time Updates**: Refresh summaries with latest commits
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Server Actions**: Fast, secure data operations with Next.js Server Actions
- **SQLite Database**: Local database for caching summaries
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance Optimized**: In-memory caching and optimized queries

### 🤖 AI Enhancement Features
- **AI-Powered Summaries**: Transform technical Git commits into coherent, business-friendly narratives
- **Intelligent Contextual Analysis**: AI understands commit patterns and groups related work
- **Multiple AI Models**: Support for Google Gemini 2.5 Pro and Anthropic Claude 3 Haiku via OpenRouter
- **Adaptive Prompting**: Smart prompt selection based on commit characteristics
- **Graceful Fallback**: Seamless fallback to basic summaries when AI is unavailable
- **Usage Tracking**: Monitor AI API usage, token consumption, and performance metrics
- **Caching System**: Intelligent caching of AI-generated content for performance
- **Error Recovery**: Robust error handling with automatic retry and fallback mechanisms
- **Smart Git Integration**: Case-insensitive author matching and multi-branch commit detection
- **Refresh Functionality**: Intelligent refresh with fallback to cached data when no new commits found

## 🚀 Quick Start

### Prerequisites

- **Bun v1.2.19+** (recommended) or Node.js 18+
- **Git repository** to analyze (uses current directory by default)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd WFG
   bun install
   ```

2. **Set up the database:**
   ```bash
   bun run db:migrate
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Basic Usage

1. **Enter your Git author name** (exactly as it appears in commits)
2. **Select a date** within the last 31 days
3. **Click "Filter Commits"** to view your Git activity
4. **Daily summaries** will be generated automatically
5. **Use "Refresh Summaries"** to update with latest commits

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Runtime**: Bun v1.2.19
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Git Integration**: simple-git library
- **Validation**: Zod schemas
- **Testing**: Jest with Bun compatibility
- **Date Handling**: date-fns with Thai locale

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui components (Button, Card, Input, etc.)
│   ├── GitFilterForm.tsx  # Filter form (client)
│   ├── GitCommitsList.tsx # Commits display (server)
│   ├── DailySummariesView.tsx # Summaries display (server)
│   └── RefreshButton.tsx  # Refresh functionality (client)
├── lib/
│   ├── actions/           # Server Actions
│   │   ├── git-actions.ts
│   │   └── summary-actions.ts
│   ├── services/          # Business logic
│   │   ├── git/          # Git operations
│   │   └── database.ts   # Database operations
│   ├── utils/            # Utilities
│   │   ├── date-formatter.ts # Thai date formatting
│   │   ├── logger.ts     # Logging system
│   │   └── cache.ts      # Caching utilities
│   └── validations/      # Zod schemas
└── types/                # TypeScript definitions
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Git Repository Path (optional)
GIT_REPOSITORY_PATH=/path/to/your/git/repository

# Database URL (optional)
DATABASE_URL=file:./wfg.db

# Node Environment
NODE_ENV=development

# AI Configuration (for enhanced summaries)
AI_ENABLED=true
OPENROUTER_API_KEY=sk-or-your-api-key-here
AI_MODEL_PRIMARY=google/gemini-2.5-pro
AI_MODEL_FALLBACK=anthropic/claude-3-haiku
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
AI_TIMEOUT=30000
```

### 🤖 AI Setup (Optional)

To enable AI-enhanced summaries:

1. **Get an OpenRouter API key**: Sign up at [openrouter.ai](https://openrouter.ai)
2. **Add your API key** to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-your-api-key-here
   ```
3. **Configure AI models** (optional):
   ```env
   AI_MODEL_PRIMARY=google/gemini-2.5-pro     # Primary model
   AI_MODEL_FALLBACK=anthropic/claude-3-haiku  # Fallback model
   ```

**Without AI configuration**, the application works perfectly with basic summaries.

See [docs/environment-configuration.md](docs/environment-configuration.md) for detailed configuration options.

### Default Behavior

- **Repository**: Uses current working directory
- **Database**: Creates `dev.db` in project root
- **Date Range**: Limited to last 31 days for performance
- **Caching**: Automatic caching of summaries and commits

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
bun test

# Run specific test categories
bun test src/__tests__/actions/     # Server Actions
bun test src/__tests__/services/    # Service layer
bun test src/__tests__/integration/ # Integration tests
bun test src/__tests__/utils/       # Utilities

# Run with coverage
bun test --coverage
```

## 📊 Performance Features

- **In-memory caching** for Git operations and summaries
- **Database caching** for persistent summary storage
- **Optimized queries** with proper indexing
- **Server Components** for fast initial page loads
- **Incremental updates** with refresh functionality

## 🌏 Thai Localization

The application includes full Thai Buddhist calendar support:

- **Date Format**: "20 ก.ย. 2568" (day month year)
- **Year Conversion**: Gregorian + 543 years = Buddhist Era
- **Month Names**: Thai abbreviated month names
- **Locale Support**: Uses `date-fns` with Thai locale

## 🔧 Development

### Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run test         # Run tests
bun run db:migrate   # Run database migrations
bun run db:generate  # Regenerate Prisma client
bun run db:studio    # Open Prisma Studio
bun run db:reset     # Reset database (development only)
```

### Adding New Features

1. **Follow TDD approach**: Write tests first
2. **Use dependency injection**: For testable services
3. **Implement proper error handling**: With user-friendly messages
4. **Add logging**: For debugging and monitoring
5. **Update documentation**: Keep README and docs current

## 🚀 Deployment

### Production Build

```bash
bun run build
bun run start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database path
3. Set up proper Git repository access
4. Ensure file system permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Report bugs and feature requests
- **Configuration**: See `docs/environment-configuration.md`

---

**Built with ❤️ using Next.js, TypeScript, and Thai Buddhist Calendar support**
