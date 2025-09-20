# Quickstart: Git Log Viewer with Daily Summaries

**Feature**: Git Log Viewer with Daily Summaries  
**Date**: 2025-09-20  
**Purpose**: Validate implementation against user stories

## Prerequisites

1. **Development Environment**:
   - Bun v1.2.19+ installed
   - Git repository with commit history
   - WFG project running on http://localhost:3000

2. **Test Data Setup**:
   
   **For Integration Tests** (Real Git):
   ```bash
   # Ensure Git config is set
   git config user.name "Test Author"
   git config user.email "test@example.com"
   
   # Create test commits (if needed)
   echo "test" > test.txt && git add . && git commit -m "feat: Add test feature"
   echo "test2" > test2.txt && git add . && git commit -m "fix: Fix test issue"
   ```
   
   **For Unit Tests** (Mock Git with Dependency Injection):
   ```typescript
   // Mock Git service for unit testing
   const mockGitService = {
     getCommits: jest.fn().mockResolvedValue([
       {
         hash: "abc123",
         author: "Test Author",
         email: "test@example.com",
         date: new Date("2025-09-20"),
         message: "feat: Add test feature",
         isMerge: false
       },
       {
         hash: "def456", 
         author: "Test Author",
         email: "test@example.com",
         date: new Date("2025-09-20"),
         message: "fix: Fix test issue",
         isMerge: false
       }
     ])
   }
   ```

## User Story Validation Tests

### Test 1: Basic Git Log Filtering
**Story**: View Git commit history for specific author and date range

**Steps**:
1. Open http://localhost:3000
2. Enter author name: "Test Author" (or your Git username)
3. Select since date: 7 days ago
4. Click "Filter" or submit form

**Expected Results**:
- ✅ System displays commits by that author from specified date onwards
- ✅ Each commit shows: date, author, commit message
- ✅ Daily summaries appear grouped by date
- ✅ Summaries use Thai date format: "18 ส.ค. 2568"
- ✅ Commit messages formatted as bullet points

### Test 2: Database Summary Persistence
**Story**: View cached daily summaries from database

**Steps**:
1. Complete Test 1 to generate summaries
2. Refresh the page (F5)
3. Enter same author and date range
4. Submit filter again

**Expected Results**:
- ✅ Summaries load quickly from database
- ✅ Same formatted content appears
- ✅ No delay for Git operations (cached)

### Test 3: Summary Refresh Functionality
**Story**: Regenerate summaries with refresh button

**Steps**:
1. Complete Test 1 to have existing summaries
2. Click "Refresh Summaries" button
3. Wait for processing to complete

**Expected Results**:
- ✅ System regenerates daily summaries
- ✅ Database records are updated
- ✅ UI shows refreshed summaries
- ✅ Success message or indicator appears

### Test 4: Multiple Commits Same Day
**Story**: Single summary per date combining all commits

**Steps**:
1. Create multiple commits on same day:
   ```bash
   git commit --allow-empty -m "feat: Morning work"
   git commit --allow-empty -m "fix: Afternoon fix"
   ```
2. Filter for today's date with your author name

**Expected Results**:
- ✅ Single summary entry for today's date
- ✅ Both commit messages appear as bullet points
- ✅ Format: "20 ก.ย. 2568\n- Morning work\n- Afternoon fix"

### Test 5: Invalid Author Handling
**Story**: Graceful handling of invalid input

**Steps**:
1. Enter non-existent author name: "NonExistentUser123"
2. Select valid date range
3. Submit filter

**Expected Results**:
- ✅ System displays "No commits found" message
- ✅ No error crashes or exceptions
- ✅ User can try different author name

### Test 6: Future Date Handling
**Story**: Handle invalid date ranges gracefully

**Steps**:
1. Enter valid author name
2. Select future date (tomorrow)
3. Submit filter

**Expected Results**:
- ✅ System shows no results or validation error
- ✅ Clear message about date range limitation
- ✅ Form remains usable for correction

## Server Actions Tests

### Test Server Action: Form Submission
**Steps**:
1. Fill out the Git filter form with valid data
2. Submit form (triggers fetchGitCommits Server Action)
3. Verify form submission works without JavaScript
4. Check that form data is properly validated

**Expected Results**:
- ✅ Server Action processes FormData correctly
- ✅ Validation errors show in form if invalid input
- ✅ Success state updates UI with commits
- ✅ Progressive enhancement: works without JS

### Test Server Action: Summary Generation
**Steps**:
1. Use form to generate summaries (generateSummaries Server Action)
2. Check database for stored summaries
3. Test refresh functionality (refreshSummaries Server Action)

**Expected Results**:
- ✅ Server Action creates database records
- ✅ ActionResult type provides proper error handling
- ✅ Success/error states properly communicated to UI

### Test Server Components: Data Fetching
**Steps**:
1. Navigate to page with GitCommitsList component
2. Verify server-side data fetching occurs
3. Check that DailySummariesView loads cached data

**Expected Results**:
- ✅ Server Components fetch data on server
- ✅ No client-side API calls required
- ✅ Proper loading states and error boundaries

## Performance Validation

### Test P1: Load Time
**Requirement**: <2s load time

**Steps**:
1. Open browser developer tools
2. Navigate to WFG application
3. Measure page load time

**Expected**: Initial page load < 2 seconds

### Test P2: Git Operation Efficiency
**Requirement**: Handle 31-day history efficiently

**Steps**:
1. Filter for maximum 31-day range
2. Measure response time
3. Check for timeout errors

**Expected**: Git operations complete < 5 seconds

### Test P3: Summary Generation Speed
**Requirement**: Fast summary generation

**Steps**:
1. Generate summaries for 10+ commits
2. Measure processing time
3. Test refresh operation speed

**Expected**: Summary generation < 3 seconds

## Error Scenario Tests

### Test E1: Git Repository Unreachable
**Steps**:
1. Temporarily rename .git directory
2. Attempt to filter commits
3. Restore .git directory

**Expected**: Clear error message displayed to user

### Test E2: Database Connection Failure
**Steps**:
1. Stop database service (if external)
2. Attempt summary operations
3. Restart database

**Expected**: Database error message shown

### Test E3: Invalid Git Author Format
**Steps**:
1. Enter special characters: "author<>@#$"
2. Submit filter

**Expected**: Validation error or safe handling

## Success Criteria

All tests must pass for feature completion:

- [ ] All 6 user story tests pass
- [ ] All 3 API endpoint tests return expected responses
- [ ] All 3 performance tests meet requirements
- [ ] All 3 error scenario tests show proper error handling
- [ ] No console errors or exceptions during testing
- [ ] UI remains responsive throughout all operations

## Troubleshooting

**Common Issues**:
1. **No commits found**: Check Git author name matches exactly
2. **Database errors**: Verify Prisma setup and migrations
3. **Date format issues**: Ensure Thai locale is properly configured
4. **Performance slow**: Check 31-day limit is enforced

**Debug Commands**:
```bash
# Check Git log manually
git log --author="YourName" --since="2025-09-13" --oneline

# Verify database
bunx prisma studio

# Check API responses
curl -v "http://localhost:3000/api/git/commits?author=test&since=2025-09-13"
```

This quickstart validates all functional requirements and ensures the implementation meets the specification requirements.
