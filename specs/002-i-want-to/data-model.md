# Data Model: AI-Enhanced Worklog Summarization

**Feature**: AI-Enhanced Worklog Summarization  
**Date**: 2025-09-20  
**Status**: Complete

## Entity Overview

This feature extends the existing WFG data model with AI-specific entities while maintaining backward compatibility with the current worklog system.

## Core Entities

### 1. AISummary (New)

**Purpose**: Stores AI-generated worklog summaries with caching and metadata

**Attributes**:
- `id`: Primary key (auto-increment integer)
- `authorName`: Git author name (string, required)
- `summaryDate`: Date of the worklog (date, required)
- `commitHashList`: JSON array of commit hashes included (text, required)
- `aiSummaryText`: AI-generated summary content (text, required)
- `modelUsed`: AI model identifier used for generation (string, required)
- `createdAt`: Timestamp of summary creation (datetime, auto)
- `updatedAt`: Timestamp of last update (datetime, auto)

**Relationships**:
- Links to existing `DailySummary` via `(authorName, summaryDate)`
- References multiple `GitCommit` entities via `commitHashList`

**Validation Rules**:
- `authorName`: Must match existing Git author pattern (1-255 chars)
- `summaryDate`: Must be within last 31 days (existing constraint)
- `commitHashList`: Must be valid JSON array of commit hashes
- `aiSummaryText`: Must not be empty, max 10,000 characters
- `modelUsed`: Must match configured model identifier pattern

**Unique Constraints**:
- `(authorName, summaryDate)`: One AI summary per author per day

### 2. AIModelConfiguration (New)

**Purpose**: Stores AI model configuration and settings

**Attributes**:
- `id`: Primary key (auto-increment integer)
- `modelIdentifier`: AI model name (string, required, unique)
- `providerName`: AI provider (string, required)
- `maxTokens`: Maximum tokens for requests (integer, required)
- `temperature`: Model temperature setting (float, required)
- `isActive`: Whether model is currently active (boolean, required)
- `isPrimary`: Whether this is the primary model (boolean, required)
- `createdAt`: Configuration creation time (datetime, auto)

**Validation Rules**:
- `modelIdentifier`: Must follow provider/model format (e.g., "openai/gpt-4o-mini")
- `providerName`: Must be supported provider ("openrouter", "openai", etc.)
- `maxTokens`: Must be between 100 and 8000
- `temperature`: Must be between 0.0 and 2.0
- Only one model can be `isPrimary` at a time

### 3. APIUsageTracking (New)

**Purpose**: Monitors AI API usage for cost and rate limit management

**Attributes**:
- `id`: Primary key (auto-increment integer)
- `requestTimestamp`: When the API call was made (datetime, required)
- `modelUsed`: Model identifier used (string, required)
- `tokensUsed`: Number of tokens consumed (integer, required)
- `requestDuration`: API call duration in milliseconds (integer, required)
- `requestStatus`: Success/failure status (string, required)
- `errorMessage`: Error details if failed (text, nullable)
- `authorName`: User who triggered the request (string, required)

**Validation Rules**:
- `requestStatus`: Must be one of ("success", "error", "timeout", "rate_limited")
- `tokensUsed`: Must be positive integer
- `requestDuration`: Must be positive integer
- `errorMessage`: Required when `requestStatus` is not "success"

## Extended Entities

### DailySummary (Extended)

**New Attributes**:
- `hasAISummary`: Boolean flag indicating AI summary availability
- `aiSummaryId`: Foreign key reference to AISummary (nullable)

**Backward Compatibility**:
- All existing attributes remain unchanged
- New attributes are nullable/optional
- Existing queries continue to work without modification

## Database Schema Changes

### New Tables

```sql
-- AI Summaries table
CREATE TABLE ai_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  summary_date DATE NOT NULL,
  commit_hash_list TEXT NOT NULL,
  ai_summary_text TEXT NOT NULL,
  model_used TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(author_name, summary_date),
  FOREIGN KEY (author_name, summary_date) 
    REFERENCES daily_summaries(author_name, summary_date)
);

-- AI Model Configuration table
CREATE TABLE ai_model_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_identifier TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  max_tokens INTEGER NOT NULL DEFAULT 1000,
  temperature REAL NOT NULL DEFAULT 0.3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Tracking table
CREATE TABLE api_usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  request_duration INTEGER NOT NULL,
  request_status TEXT NOT NULL,
  error_message TEXT,
  author_name TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_ai_summaries_author_date ON ai_summaries(author_name, summary_date);
CREATE INDEX idx_api_usage_timestamp ON api_usage_tracking(request_timestamp);
CREATE INDEX idx_api_usage_author ON api_usage_tracking(author_name);
```

### Table Alterations

```sql
-- Extend existing daily_summaries table
ALTER TABLE daily_summaries 
ADD COLUMN has_ai_summary BOOLEAN DEFAULT false;

ALTER TABLE daily_summaries 
ADD COLUMN ai_summary_id INTEGER 
REFERENCES ai_summaries(id);
```

## Data Flow

### AI Summary Generation Flow

1. **Input**: Git commits for specific author and date range
2. **Processing**: 
   - Check for existing AI summary in cache
   - If not found, generate via AI service
   - Store result in `ai_summaries` table
   - Update `daily_summaries` with reference
3. **Output**: Enhanced summary combining basic and AI content

### Cache Invalidation Flow

1. **Trigger**: User clicks refresh button
2. **Processing**:
   - Delete existing AI summary for date range
   - Update `daily_summaries` to remove AI references
   - Regenerate summaries (will create new AI summaries)
3. **Result**: Fresh AI summaries with latest commits

### Fallback Flow

1. **AI Service Failure**: API call fails or times out
2. **Fallback**: Return existing basic summary from `daily_summaries`
3. **Logging**: Record failure in `api_usage_tracking`
4. **User Experience**: Seamless fallback without error disruption

## Data Relationships

```
GitCommit (existing)
    ↓ (many-to-many via commit_hash_list)
AISummary (new)
    ↓ (one-to-one)
DailySummary (extended)
    ↓ (references)
APIUsageTracking (new)
    ↓ (references)
AIModelConfiguration (new)
```

## Migration Strategy

### Phase 1: Schema Extension
- Add new tables with proper constraints
- Extend existing tables with nullable columns
- Create necessary indexes

### Phase 2: Data Population
- Populate `ai_model_configurations` with default settings
- Existing `daily_summaries` remain unchanged
- New AI summaries generated on-demand

### Phase 3: Cleanup (Future)
- Optional: Archive old API usage data
- Optional: Optimize indexes based on usage patterns

## Performance Considerations

### Query Optimization
- Indexed lookups on `(author_name, summary_date)`
- Efficient JSON handling for `commit_hash_list`
- Minimal joins required for common operations

### Storage Efficiency
- AI summaries cached indefinitely until refresh
- API usage data can be archived after 30 days
- Commit hash lists stored as compact JSON

### Scalability
- Single-user application: No concurrency concerns
- SQLite performance adequate for expected data volume
- Future migration to PostgreSQL possible if needed

## Data Validation

### Input Validation
- All user inputs validated via existing Zod schemas
- AI model responses validated before storage
- Commit hash integrity verified before caching

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate summaries
- Check constraints validate enum values and ranges

### Error Handling
- Graceful handling of malformed AI responses
- Automatic cleanup of orphaned records
- Comprehensive logging for debugging

## Security Considerations

### Data Protection
- No sensitive commit content stored permanently on external services
- API keys stored securely in environment variables
- Database access restricted to application layer

### Privacy Compliance
- All data stored locally in SQLite database
- No user tracking or analytics data collected
- AI service requests contain only necessary commit metadata

## Conclusion

The data model extension provides:
- **Backward Compatibility**: Existing functionality unchanged
- **Performance**: Efficient caching and query patterns
- **Reliability**: Comprehensive error handling and fallback
- **Scalability**: Room for future enhancements
- **Security**: Privacy-first approach with local data storage

Ready for contract generation and implementation planning.
