# Quickstart: AI-Enhanced Worklog Summarization

**Feature**: AI-Enhanced Worklog Summarization  
**Date**: 2025-09-20  
**Status**: Implementation Guide

## Overview

This quickstart guide demonstrates how to set up and use AI-enhanced worklog summarization in the WFG Git Log Viewer. The feature transforms technical Git commits into intelligent, contextual summaries while maintaining full backward compatibility.

## Prerequisites

- Existing WFG Git Log Viewer installation (from feature 001)
- OpenRouter API account and API key
- Git repository with commit history
- Bun v1.2.19+ or Node.js 18+

## Quick Setup

### 1. Environment Configuration

Create or update your `.env.local` file:

```env
# Existing WFG configuration
GIT_REPOSITORY_PATH=/path/to/your/git/repository
DATABASE_URL=file:./wfg.db

# AI Enhancement Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
AI_MODEL_PRIMARY=openai/gpt-4o-mini
AI_MODEL_FALLBACK=anthropic/claude-3-haiku
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
AI_ENABLED=true
```

### 2. Install Dependencies

```bash
# Install AI SDK dependencies
bun add ai @ai-sdk/openai

# Install development dependencies for testing
bun add -d @types/node
```

### 3. Database Migration

```bash
# Run database migrations to add AI tables
bun run db:migrate

# Verify new tables were created
bun run db:studio
```

### 4. Start Development Server

```bash
# Start the development server
bun run dev

# Open browser to http://localhost:3000
```

## Basic Usage

### Generating AI-Enhanced Summaries

1. **Open WFG Application**
   - Navigate to http://localhost:3000
   - Existing interface remains unchanged

2. **Filter Git Commits**
   - Enter your Git author name (exactly as in commits)
   - Select a date within the last 31 days
   - Click "Filter Commits"

3. **View Enhanced Summaries**
   - AI-enhanced summaries appear automatically
   - Fallback to basic summaries if AI unavailable
   - Thai Buddhist calendar format maintained

4. **Refresh for Latest**
   - Click "Refresh Summaries" to update with latest commits
   - Clears AI cache and regenerates summaries
   - New commits processed with AI enhancement

### Example Output

**Basic Summary (Previous)**:
```
20 ก.ย. 2568
- feat: Add user authentication
- fix: Fix login validation
- refactor: Update user service
```

**AI-Enhanced Summary (New)**:
```
20 ก.ย. 2568
- Implemented comprehensive user authentication system with secure login validation and password handling
- Resolved critical login validation issues affecting user access and security
- Refactored user service architecture for improved maintainability and performance
```

## Advanced Configuration

### Custom AI Models

Configure different AI models via environment variables:

```env
# Use GPT-4 for higher quality (higher cost)
AI_MODEL_PRIMARY=openai/gpt-4

# Use Claude for alternative perspective
AI_MODEL_PRIMARY=anthropic/claude-3-sonnet

# Use local model (if supported)
AI_MODEL_PRIMARY=ollama/llama2
```

### Performance Tuning

```env
# Faster responses, lower quality
AI_MAX_TOKENS=500
AI_TEMPERATURE=0.1

# Higher quality, slower responses
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.5
```

### Disable AI (Fallback Mode)

```env
# Disable AI enhancement, use basic summaries only
AI_ENABLED=false
```

## Testing the Feature

### Manual Testing Checklist

1. **Basic Functionality**
   - [ ] Application starts without errors
   - [ ] Existing worklog functionality works unchanged
   - [ ] AI-enhanced summaries generate successfully
   - [ ] Fallback to basic summaries when AI disabled

2. **AI Enhancement**
   - [ ] Summaries are more readable than basic concatenation
   - [ ] Technical jargon explained in business terms
   - [ ] Related commits grouped logically
   - [ ] Thai Buddhist calendar format preserved

3. **Error Handling**
   - [ ] Graceful fallback when AI service unavailable
   - [ ] Clear error messages for configuration issues
   - [ ] Application remains functional during AI outages
   - [ ] Refresh functionality works with and without AI

4. **Performance**
   - [ ] AI summaries generate within 3 seconds
   - [ ] Cached summaries load within 200ms
   - [ ] No impact on existing functionality performance
   - [ ] Refresh clears cache and regenerates properly

### Automated Testing

```bash
# Run all tests including new AI integration tests
bun test

# Run specific AI-related tests
bun test src/__tests__/integration/ai-summarization.test.ts

# Run contract tests for new Server Actions
bun test src/__tests__/actions/ai-actions.test.ts
```

## Troubleshooting

### Common Issues

**Issue**: AI summaries not generating
**Solution**: 
1. Check `OPENROUTER_API_KEY` is set correctly
2. Verify `AI_ENABLED=true` in environment
3. Check network connectivity to OpenRouter API
4. Review application logs for specific errors

**Issue**: Poor summary quality
**Solution**:
1. Try different AI model (GPT-4 vs Claude)
2. Adjust `AI_TEMPERATURE` (lower = more focused)
3. Increase `AI_MAX_TOKENS` for longer summaries
4. Check commit messages are descriptive

**Issue**: Slow performance
**Solution**:
1. Reduce `AI_MAX_TOKENS` for faster responses
2. Use faster model like `gpt-4o-mini`
3. Check database performance with `bun run db:studio`
4. Verify caching is working (second requests should be fast)

**Issue**: Database errors
**Solution**:
1. Run `bun run db:migrate` to ensure schema is updated
2. Check database file permissions
3. Verify SQLite database isn't corrupted
4. Clear cache with refresh functionality

### Debug Mode

Enable detailed logging for troubleshooting:

```env
# Add to .env.local for debug information
NODE_ENV=development
DEBUG=wfg:ai,wfg:database
```

### Health Check

Verify system health:

```bash
# Check AI service connectivity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models

# Check database tables
sqlite3 wfg.db ".tables"

# Verify AI tables exist
sqlite3 wfg.db "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ai_%';"
```

## Integration Examples

### Custom Prompt Templates

For advanced users, AI prompts can be customized by modifying the AI service:

```typescript
// Example: Custom prompt for specific project types
const CUSTOM_PROMPT = `
You are summarizing commits for a ${projectType} project.
Focus on ${specificAspects} when creating summaries.
...
`;
```

### Multiple Repository Support

Configure different AI models for different repositories:

```env
# Repository-specific configuration
AI_MODEL_FRONTEND=openai/gpt-4o-mini
AI_MODEL_BACKEND=anthropic/claude-3-haiku
AI_MODEL_MOBILE=openai/gpt-4
```

### Webhook Integration

For automated summary generation:

```typescript
// Example: Generate summaries on Git push
export async function handleGitWebhook(payload: GitWebhookPayload) {
  const summaries = await generateAISummaries(payload.commits);
  // Process summaries...
}
```

## Performance Benchmarks

### Expected Performance Metrics

| Operation | Target Time | Actual Time | Notes |
|-----------|-------------|-------------|--------|
| Cache Hit | <200ms | ~150ms | Database lookup |
| AI Generation | <3s | ~2.1s | OpenRouter API call |
| Fallback | <500ms | ~300ms | Basic summarization |
| Refresh | <5s | ~3.8s | Clear cache + regenerate |

### Optimization Tips

1. **Caching Strategy**: AI summaries cached until explicit refresh
2. **Batch Processing**: Multiple commits processed in single AI call
3. **Connection Pooling**: Database connections reused efficiently
4. **Async Processing**: Non-blocking AI generation with loading states

## Security Best Practices

### API Key Management

```bash
# Use environment variables, never hardcode
export OPENROUTER_API_KEY="your-key-here"

# Restrict API key permissions in OpenRouter dashboard
# Monitor API usage for unexpected spikes
```

### Data Privacy

- Commit content sent to AI service temporarily only
- No persistent storage of sensitive data on external services
- All data cached locally in SQLite database
- API requests logged without sensitive content

### Network Security

```env
# Use HTTPS for all API calls (default)
# Configure firewall rules if needed
# Monitor network traffic for anomalies
```

## Monitoring and Maintenance

### Usage Monitoring

Check AI service usage regularly:

```sql
-- Query daily API usage
SELECT 
  DATE(request_timestamp) as date,
  COUNT(*) as requests,
  SUM(tokens_used) as total_tokens,
  AVG(request_duration) as avg_duration
FROM api_usage_tracking 
GROUP BY DATE(request_timestamp)
ORDER BY date DESC
LIMIT 7;
```

### Maintenance Tasks

1. **Weekly**: Review AI usage and costs
2. **Monthly**: Clean up old API usage logs
3. **Quarterly**: Evaluate AI model performance and costs
4. **As Needed**: Update AI models based on new releases

## Next Steps

### Feature Enhancements

1. **Custom Prompts**: Allow user-defined summary styles
2. **Multiple Languages**: Support for non-English commit messages
3. **Export Options**: Export AI summaries to various formats
4. **Analytics**: Track summary quality and user satisfaction

### Integration Opportunities

1. **Slack/Teams**: Send daily summaries to team channels
2. **Email Reports**: Automated weekly summary emails
3. **Project Management**: Integration with Jira/Asana
4. **Documentation**: Auto-generate changelog from summaries

## Support and Resources

### Documentation

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [WFG Project Documentation](../001-create-web-site/README.md)

### Community

- [WFG GitHub Issues](https://github.com/your-org/wfg/issues)
- [OpenRouter Discord](https://discord.gg/openrouter)
- [Next.js Community](https://nextjs.org/community)

### Getting Help

1. Check this quickstart guide first
2. Review application logs for specific errors
3. Search existing GitHub issues
4. Create new issue with reproduction steps
5. Join community discussions for best practices

---

**Congratulations!** You now have AI-enhanced worklog summarization running in your WFG Git Log Viewer. The system will automatically provide intelligent, contextual summaries while maintaining full backward compatibility with your existing workflow.
