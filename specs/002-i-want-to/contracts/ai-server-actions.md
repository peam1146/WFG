# Server Actions Contract: AI-Enhanced Worklog Summarization

**Feature**: AI-Enhanced Worklog Summarization  
**Date**: 2025-09-20  
**Status**: Contract Definition

## Overview

This contract defines the Server Actions interface for AI-enhanced worklog summarization, extending the existing WFG Server Actions with AI capabilities while maintaining backward compatibility.

## Server Actions

### 1. generateAISummaries

**Purpose**: Generate AI-enhanced worklog summaries with fallback to basic summaries

**Signature**:
```typescript
async function generateAISummaries(
  formData: FormData,
  injectedServices?: {
    gitService?: GitService;
    aiService?: AIService;
    databaseService?: DatabaseService;
  }
): Promise<ActionResult<DailySummary[]>>
```

**Input Parameters**:
- `formData.author` (string, required): Git author name
- `formData.since` (string, required): Start date in YYYY-MM-DD format
- `formData.refresh` (string, optional): "true" to force refresh, default "false"
- `formData.useAI` (string, optional): "true" to enable AI, default "true"

**Validation Rules**:
- `author`: Must be 1-255 characters, trimmed
- `since`: Must be valid date within last 31 days
- `refresh`: Must be boolean-convertible string
- `useAI`: Must be boolean-convertible string

**Success Response**:
```typescript
{
  success: true,
  data: DailySummary[] // Array of enhanced summaries
}
```

**Error Response**:
```typescript
{
  success: false,
  error: string, // User-friendly error message
  code: string   // Error code for debugging
}
```

**Behavior**:
1. Validate input parameters using existing validation schemas
2. Check for cached AI summaries unless `refresh=true`
3. If AI enabled and no cache, attempt AI generation
4. On AI failure, fall back to existing basic summarization
5. Cache successful AI summaries for future requests
6. Return enhanced summaries with AI content when available

**Error Handling**:
- **Validation Error**: Return validation-specific error message
- **AI Service Error**: Log error, fall back to basic summaries
- **Database Error**: Return database operation error
- **Git Error**: Return Git operation error

### 2. refreshAISummaries

**Purpose**: Force refresh of AI summaries, clearing cache and regenerating

**Signature**:
```typescript
async function refreshAISummaries(
  author: string,
  since: Date,
  injectedServices?: {
    gitService?: GitService;
    aiService?: AIService;
    databaseService?: DatabaseService;
  }
): Promise<ActionResult<DailySummary[]>>
```

**Input Parameters**:
- `author` (string, required): Git author name
- `since` (Date, required): Start date for refresh

**Validation Rules**:
- Same as `generateAISummaries` for author and date

**Behavior**:
1. Delete existing AI summaries for the date range
2. Clear related cache entries
3. Regenerate summaries with fresh AI calls
4. Update database with new AI summaries
5. Return refreshed summary data

**Success/Error Response**: Same format as `generateAISummaries`

### 3. getAIModelStatus

**Purpose**: Get current AI model configuration and usage statistics

**Signature**:
```typescript
async function getAIModelStatus(): Promise<ActionResult<AIModelStatus>>
```

**Input Parameters**: None

**Success Response**:
```typescript
{
  success: true,
  data: {
    currentModel: string,        // Currently active model
    fallbackModel: string,       // Fallback model identifier
    isAIEnabled: boolean,        // Whether AI is currently enabled
    todayUsage: {
      requests: number,          // API requests today
      tokens: number,            // Tokens used today
      errors: number             // Failed requests today
    },
    lastError?: string           // Most recent error message
  }
}
```

**Behavior**:
1. Query current model configuration
2. Calculate today's usage statistics
3. Check AI service availability
4. Return comprehensive status information

## Data Types

### Enhanced DailySummary

```typescript
interface DailySummary {
  // Existing fields
  authorName: string;
  summaryDate: Date;
  summaryText: string;
  repositoryUrl: string;
  
  // New AI-enhanced fields
  hasAISummary: boolean;
  aiSummaryText?: string;
  aiModelUsed?: string;
  generatedAt?: Date;
}
```

### AIModelStatus

```typescript
interface AIModelStatus {
  currentModel: string;
  fallbackModel: string;
  isAIEnabled: boolean;
  todayUsage: {
    requests: number;
    tokens: number;
    errors: number;
  };
  lastError?: string;
}
```

### ActionResult (Existing)

```typescript
interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
```

## Integration Points

### Existing Server Actions

**Modified Actions**:
- `generateSummaries`: Enhanced to optionally use AI
- `refreshSummaries`: Enhanced to clear AI cache

**New Actions**:
- `generateAISummaries`: Primary AI-enhanced action
- `refreshAISummaries`: AI-specific refresh action
- `getAIModelStatus`: Status and monitoring action

### Service Dependencies

**Required Services**:
- `GitService`: Existing Git operations (unchanged)
- `DatabaseService`: Extended with AI summary operations
- `AIService`: New service for AI model interactions

**Service Interfaces**:
```typescript
interface AIService {
  generateSummary(commits: GitCommit[], config: AIConfig): Promise<string>;
  isAvailable(): Promise<boolean>;
  getUsageStats(): Promise<UsageStats>;
}

interface DatabaseService {
  // Existing methods unchanged
  saveDailySummary(summary: DailySummary): Promise<void>;
  getDailySummaries(author: string, since: Date): Promise<DailySummary[]>;
  
  // New AI-specific methods
  saveAISummary(aiSummary: AISummary): Promise<void>;
  getAISummary(author: string, date: Date): Promise<AISummary | null>;
  deleteAISummaries(author: string, since: Date): Promise<void>;
}
```

## Error Codes

### AI-Specific Error Codes

- `AI_SERVICE_UNAVAILABLE`: AI service is not responding
- `AI_RATE_LIMITED`: API rate limit exceeded
- `AI_INVALID_RESPONSE`: AI returned malformed response
- `AI_TOKEN_LIMIT_EXCEEDED`: Request exceeds token limits
- `AI_MODEL_NOT_CONFIGURED`: Requested model not available

### Existing Error Codes (Reused)

- `VALIDATION_ERROR`: Input validation failed
- `GIT_ERROR`: Git operation failed
- `DATABASE_ERROR`: Database operation failed
- `SERVER_ACTION_ERROR`: General server action error

## Backward Compatibility

### Existing Functionality

- All existing Server Actions continue to work unchanged
- Existing UI components receive enhanced data transparently
- No breaking changes to existing API contracts

### Migration Strategy

- New AI features are additive only
- Existing summaries remain available during AI service outages
- Graceful degradation ensures continuous functionality

## Testing Requirements

### Contract Tests

Each Server Action must have corresponding contract tests:

```typescript
// Example contract test structure
describe('generateAISummaries Contract', () => {
  it('should accept valid FormData and return ActionResult<DailySummary[]>');
  it('should validate author name is required');
  it('should validate since date format and range');
  it('should handle AI service failures gracefully');
  it('should fall back to basic summaries when AI unavailable');
  it('should cache AI summaries for subsequent requests');
});
```

### Integration Tests

- End-to-end AI summary generation flow
- Cache invalidation and refresh scenarios
- Error handling and fallback behavior
- Performance under various load conditions

## Performance Requirements

### Response Time Targets

- **Cache Hit**: <200ms (existing performance)
- **AI Generation**: <3s (new AI-enhanced path)
- **Fallback**: <500ms (existing basic summarization)

### Throughput Requirements

- Support existing single-user workload
- Handle refresh operations efficiently
- Minimize AI API calls through effective caching

## Security Considerations

### Input Validation

- All inputs validated using existing Zod schemas
- Additional validation for AI-specific parameters
- Sanitization of AI-generated content before storage

### API Security

- API keys stored securely in environment variables
- No sensitive data logged in AI requests
- Rate limiting to prevent API abuse

### Data Privacy

- Commit content not persisted on external AI services
- Local caching only in SQLite database
- User consent implied through feature usage

## Monitoring and Observability

### Logging Requirements

- AI service request/response logging (without sensitive data)
- Performance metrics for AI vs. basic summaries
- Error rates and fallback usage statistics

### Health Checks

- AI service availability monitoring
- Model configuration validation
- Database connectivity for AI tables

## Conclusion

This contract defines a comprehensive AI enhancement to the existing WFG worklog system while maintaining:

- **Backward Compatibility**: Existing functionality unchanged
- **Reliability**: Graceful fallback to proven basic summaries
- **Performance**: Efficient caching and reasonable response times
- **Security**: Privacy-first approach with local data storage
- **Testability**: Clear contracts enable comprehensive testing

Ready for quickstart guide generation and test implementation.
