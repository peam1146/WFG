# Data Model: Git Log Viewer with Daily Summaries

**Feature**: Git Log Viewer with Daily Summaries  
**Date**: 2025-09-20  
**Status**: Complete

## Entity Definitions

### 1. DailySummary (Database Entity)

**Purpose**: Store generated daily summaries for persistence and caching

**Schema**:
```typescript
model DailySummary {
  id            String   @id @default(cuid())
  authorName    String   
  summaryDate   DateTime @db.Date
  summaryText   String   @db.Text
  repositoryUrl String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([authorName, summaryDate, repositoryUrl])
  @@index([authorName, summaryDate])
}
```

**Validation Rules**:
- `authorName`: Required, non-empty string, max 255 chars
- `summaryDate`: Required, valid date, not future date
- `summaryText`: Required, non-empty, formatted as bullet points
- `repositoryUrl`: Required, valid URL format

**State Transitions**:
- Created → when first summary generated
- Updated → when refresh button clicked and new summary generated

### 2. GitCommit (Runtime Entity - Not Persisted)

**Purpose**: Represent individual Git commits fetched from repository

**TypeScript Interface**:
```typescript
interface GitCommit {
  hash: string;           // Git commit SHA
  author: string;         // Commit author name
  email: string;          // Author email
  date: Date;            // Commit date
  message: string;       // Commit message
  isMerge: boolean;      // True if merge commit (to be skipped)
}
```

**Validation Rules**:
- `hash`: Required, valid SHA format
- `author`: Required, non-empty string
- `date`: Required, within last 31 days
- `message`: Required, non-empty string
- `isMerge`: Boolean, skip if true

### 3. FilterCriteria (Runtime Entity)

**Purpose**: User input parameters for filtering Git commits

**TypeScript Interface**:
```typescript
interface FilterCriteria {
  authorName: string;     // Git author to filter by
  sinceDate: Date;       // Start date for commit history
  repositoryPath: string; // Path to Git repository (from config)
}
```

**Validation Rules**:
- `authorName`: Required, non-empty, trimmed
- `sinceDate`: Required, not future date, max 31 days ago
- `repositoryPath`: Required, valid directory path, contains .git

### 4. DailySummaryGroup (Runtime Entity)

**Purpose**: Grouped commits by date for summary generation

**TypeScript Interface**:
```typescript
interface DailySummaryGroup {
  date: Date;                    // Summary date
  commits: GitCommit[];          // Commits for this date
  formattedDate: string;         // Thai formatted date (e.g., "18 ส.ค. 2568")
  bulletPoints: string[];        // Individual commit messages as bullets
  summaryText: string;           // Final formatted summary
}
```

## Entity Relationships

```
FilterCriteria → GitCommit[] (1:N)
GitCommit[] → DailySummaryGroup[] (N:M grouped by date)
DailySummaryGroup → DailySummary (1:1 persistence)
```

## Database Indexes

```sql
-- Primary performance index for lookups
CREATE INDEX idx_author_date ON DailySummary(authorName, summaryDate);

-- Repository-specific queries
CREATE INDEX idx_repository ON DailySummary(repositoryUrl);

-- Time-based cleanup queries
CREATE INDEX idx_created_at ON DailySummary(createdAt);
```

## Data Flow

1. **Input**: User provides FilterCriteria
2. **Fetch**: Git service returns GitCommit[] array
3. **Filter**: Remove merge commits, apply date range
4. **Group**: Group commits by date into DailySummaryGroup[]
5. **Format**: Generate Thai-formatted bullet point summaries
6. **Persist**: Save/update DailySummary records in database
7. **Display**: Return formatted summaries to UI

## Validation Schema (Zod)

```typescript
const FilterCriteriaSchema = z.object({
  authorName: z.string().min(1).max(255).trim(),
  sinceDate: z.date().max(new Date()).refine(
    date => date >= subDays(new Date(), 31),
    "Date must be within last 31 days"
  )
});

const DailySummarySchema = z.object({
  authorName: z.string().min(1).max(255),
  summaryDate: z.date(),
  summaryText: z.string().min(1),
  repositoryUrl: z.string().url()
});
```

## Error Scenarios

| Scenario | Entity | Validation |
|----------|--------|------------|
| Invalid author | FilterCriteria | Empty string validation |
| Future date | FilterCriteria | Date range validation |
| No commits found | GitCommit[] | Empty array handling |
| Database failure | DailySummary | Connection error handling |
| Git repo not found | GitCommit | Repository validation |

## Performance Considerations

- Database unique constraint prevents duplicate summaries
- Indexes optimize author + date lookups
- 31-day limit prevents excessive Git operations
- Merge commit filtering reduces processing overhead
- Cached summaries avoid repeated Git operations

## Next Phase

Ready for API contract generation based on these entities and validation rules.
