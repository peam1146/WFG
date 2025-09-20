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
