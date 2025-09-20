# Environment Configuration

## Environment Variables

The WFG Git Log Viewer supports the following environment variables for configuration:

### Required Variables

None - the application will work with default settings.

### Optional Variables

#### `GIT_REPOSITORY_PATH`
- **Description**: Path to the Git repository to analyze
- **Default**: Current working directory (`process.cwd()`)
- **Example**: `/Users/username/projects/my-repo`
- **Usage**: Override the default repository path for Git operations

#### `DATABASE_URL`
- **Description**: SQLite database connection string
- **Default**: `file:./dev.db`
- **Example**: `file:./wfg.db`
- **Usage**: Configure database location and connection parameters

### AI Enhancement Variables

#### `OPENROUTER_API_KEY`
- **Description**: API key for OpenRouter AI service integration
- **Default**: None (required for AI features)
- **Example**: `sk-or-v1-abc123def456...`
- **Usage**: Enable AI-enhanced worklog summarization
- **Security**: Store securely, never commit to version control

#### `AI_MODEL_PRIMARY`
- **Description**: Primary AI model for summary generation
- **Default**: `openai/gpt-4o-mini`
- **Example**: `anthropic/claude-3-haiku`
- **Usage**: Configure which AI model to use for worklog summaries

#### `AI_MODEL_FALLBACK`
- **Description**: Fallback AI model when primary fails
- **Default**: `anthropic/claude-3-haiku`
- **Example**: `openai/gpt-3.5-turbo`
- **Usage**: Backup model for reliability

#### `AI_MAX_TOKENS`
- **Description**: Maximum tokens for AI API requests
- **Default**: `1000`
- **Example**: `2000`
- **Usage**: Control AI response length and API costs

#### `AI_TEMPERATURE`
- **Description**: AI model temperature (creativity vs consistency)
- **Default**: `0.3`
- **Example**: `0.7`
- **Usage**: Lower values = more consistent, higher = more creative

#### `AI_ENABLED`
- **Description**: Enable or disable AI enhancement features
- **Default**: `true`
- **Example**: `false`
- **Usage**: Toggle AI features on/off without removing configuration
- **Description**: SQLite database connection string
- **Default**: `file:./dev.db` (development), `file:./test.db` (testing)
- **Example**: `file:./wfg-production.db`
- **Usage**: Specify custom database location

#### `NODE_ENV`
- **Description**: Application environment
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Usage**: Controls logging, error handling, and database behavior

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in the project root:

```bash
# Copy the example and customize
cp .env.example .env.local
```

### 2. Configure Variables

Edit `.env.local` with your settings:

```env
# Git Repository Configuration
GIT_REPOSITORY_PATH=/path/to/your/git/repository

# Database Configuration
DATABASE_URL=file:./wfg.db

# Environment
NODE_ENV=development
```

### 3. Environment File Template

Create `.env.example` as a template for other developers:

```env
# Git Repository Path (optional)
# GIT_REPOSITORY_PATH=/path/to/your/git/repository

# Database URL (optional)
# DATABASE_URL=file:./wfg.db

# Node Environment (optional)
# NODE_ENV=development
```

## Security Notes

- ⚠️ **Never commit `.env.local`** - it's already in `.gitignore`
- ✅ **Commit `.env.example`** - it serves as documentation
- 🔒 **No sensitive data** - current variables are safe but follow best practices

## Default Behavior

If no environment variables are set:

1. **Git Repository**: Uses current working directory
2. **Database**: Creates `dev.db` in project root
3. **Environment**: Defaults to `development` mode

## Validation

The application validates environment variables on startup:

- **Git Repository**: Checks if path exists and contains `.git` folder
- **Database**: Creates database file if it doesn't exist
- **Invalid paths**: Falls back to defaults with console warnings

## Production Deployment

For production deployments:

```env
NODE_ENV=production
GIT_REPOSITORY_PATH=/var/app/repository
DATABASE_URL=file:/var/app/data/wfg.db
```

Ensure the application has read/write permissions for:
- Git repository path (read-only)
- Database file location (read/write)
- Temporary files directory
