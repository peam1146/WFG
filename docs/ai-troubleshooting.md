# AI Troubleshooting Guide

This guide helps you diagnose and resolve issues with the AI-enhanced worklog summarization feature.

## 🔧 Quick Diagnostics

### Check AI Status

1. **Environment Variables**: Ensure your `.env.local` file contains:
   ```env
   AI_ENABLED=true
   OPENROUTER_API_KEY=sk-or-your-api-key-here
   ```

2. **API Key Format**: OpenRouter keys should start with `sk-or-`

3. **Test Connection**: Check the browser console for AI service errors

## 🚨 Common Issues

### Issue: AI Summaries Not Generated

**Symptoms:**
- Only basic summaries appear
- No "AI Enhanced" badges visible
- Summaries look like simple bullet points

**Solutions:**

1. **Check AI Configuration**:
   ```bash
   # Verify environment variables
   echo $AI_ENABLED
   echo $OPENROUTER_API_KEY
   ```

2. **Validate API Key**:
   - Ensure key starts with `sk-or-`
   - Check key hasn't expired at [openrouter.ai](https://openrouter.ai)
   - Verify sufficient credits in your account

3. **Check Application Logs**:
   ```bash
   # Look for AI-related errors
   bun run dev
   # Check browser console and terminal output
   ```

### Issue: "AI Service Unavailable" Error

**Symptoms:**
- Error message about AI service being unavailable
- Fallback to basic summaries
- Red status indicator

**Solutions:**

1. **Network Connectivity**:
   ```bash
   # Test OpenRouter API connectivity
   curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        https://openrouter.ai/api/v1/models
   ```

2. **API Key Validation**:
   - Log into [openrouter.ai](https://openrouter.ai)
   - Check API key permissions
   - Verify account status and credits

3. **Firewall/Proxy Issues**:
   - Ensure `openrouter.ai` is accessible
   - Check corporate firewall settings
   - Verify proxy configuration if applicable

### Issue: Slow AI Response Times

**Symptoms:**
- Long loading times (>30 seconds)
- Timeout errors
- Inconsistent response times

**Solutions:**

1. **Adjust Timeout Settings**:
   ```env
   AI_TIMEOUT=60000  # Increase to 60 seconds
   ```

2. **Model Selection**:
   ```env
   # Use faster models
   AI_MODEL_PRIMARY=openai/gpt-4o-mini
   AI_MODEL_FALLBACK=anthropic/claude-3-haiku
   ```

3. **Reduce Token Limits**:
   ```env
   AI_MAX_TOKENS=500  # Reduce for faster responses
   ```

### Issue: Rate Limit Exceeded

**Symptoms:**
- "Rate limit exceeded" errors
- Temporary AI service unavailability
- 429 HTTP status codes in logs

**Solutions:**

1. **Check Usage Limits**:
   - Review OpenRouter account limits
   - Monitor daily/monthly usage
   - Consider upgrading plan if needed

2. **Implement Delays**:
   ```env
   AI_TIMEOUT=45000  # Longer timeout for rate-limited requests
   ```

3. **Use Caching**:
   - AI summaries are cached automatically
   - Avoid refreshing unnecessarily
   - Check cache hit rates in logs

### Issue: Poor Summary Quality

**Symptoms:**
- Summaries don't make sense
- Missing important information
- Overly technical or too generic

**Solutions:**

1. **Adjust Temperature**:
   ```env
   AI_TEMPERATURE=0.3  # Lower for more focused summaries
   AI_TEMPERATURE=0.7  # Higher for more creative summaries
   ```

2. **Try Different Models**:
   ```env
   # More analytical
   AI_MODEL_PRIMARY=anthropic/claude-3-haiku
   
   # More creative
   AI_MODEL_PRIMARY=openai/gpt-4o-mini
   ```

3. **Check Commit Quality**:
   - Ensure commit messages are descriptive
   - Use conventional commit format when possible
   - Group related changes in single commits

## 🔍 Debugging Steps

### 1. Enable Debug Logging

Set environment variable for detailed logs:
```env
NODE_ENV=development
```

### 2. Check Browser Console

Open Developer Tools (F12) and look for:
- Network errors to OpenRouter API
- JavaScript errors in AI components
- Failed Server Action calls

### 3. Verify Database State

```bash
# Open Prisma Studio to check AI data
bun run db:studio

# Check for AI summaries in database
# Look at AISummary and APIUsageTracking tables
```

### 4. Test AI Service Directly

Create a test script to isolate AI service issues:

```typescript
// test-ai.ts
import { OpenRouterAIService } from '@/lib/services/ai/openrouter-ai';

const aiService = new OpenRouterAIService({
  apiKey: process.env.OPENROUTER_API_KEY!
});

async function testAI() {
  try {
    const isAvailable = await aiService.isAvailable();
    console.log('AI Available:', isAvailable);
    
    if (isAvailable) {
      const testCommits = [{
        hash: 'test123',
        author: 'Test User',
        email: 'test@example.com',
        date: new Date(),
        message: 'feat: Test commit for AI debugging',
        isMerge: false
      }];
      
      const summary = await aiService.generateSummary(testCommits, {
        model: 'openai/gpt-4o-mini',
        maxTokens: 500,
        temperature: 0.3,
        timeout: 30000
      });
      
      console.log('Generated Summary:', summary);
    }
  } catch (error) {
    console.error('AI Test Failed:', error);
  }
}

testAI();
```

## 📊 Monitoring AI Performance

### Check Usage Statistics

The application tracks AI usage automatically. Monitor:

1. **Request Count**: Number of AI API calls
2. **Token Usage**: Total tokens consumed
3. **Error Rate**: Failed requests percentage
4. **Response Time**: Average API latency

### Performance Benchmarks

Expected performance targets:
- **Single day (1-5 commits)**: < 3 seconds
- **Multiple days (5-15 commits)**: < 5 seconds  
- **Large batches (15+ commits)**: < 10 seconds

### Cache Effectiveness

Monitor cache hit rates:
- **High cache hits**: Good performance, low API usage
- **Low cache hits**: Consider adjusting cache TTL
- **Cache misses**: Check for commit hash changes

## 🛠️ Advanced Configuration

### Custom Model Configuration

```env
# Advanced model settings
AI_MODEL_PRIMARY=openai/gpt-4o-mini
AI_MODEL_FALLBACK=anthropic/claude-3-haiku
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
AI_TIMEOUT=30000
```

### Prompt Customization

The system uses adaptive prompts based on commit patterns:
- **Few commits (≤3)**: Concise template
- **Many commits (≥10)**: Time-based template  
- **Feature-heavy**: Feature-focused template
- **Balanced**: Default comprehensive template

### Error Recovery Settings

```env
# Retry configuration (in service code)
RETRY_ATTEMPTS=2
RETRY_DELAY=1000
FALLBACK_ENABLED=true
```

## 🆘 Getting Help

### Log Analysis

When reporting issues, include:

1. **Environment Variables** (without API key):
   ```
   AI_ENABLED=true
   AI_MODEL_PRIMARY=openai/gpt-4o-mini
   AI_MAX_TOKENS=1000
   AI_TEMPERATURE=0.3
   ```

2. **Error Messages**: Full error text from console/logs

3. **Commit Information**: Number and type of commits being processed

4. **Timing**: When the issue started occurring

### Common Error Codes

- `AI_SERVICE_UNAVAILABLE`: Network or API issues
- `AI_RATE_LIMITED`: Usage limits exceeded  
- `AI_TIMEOUT`: Request took too long
- `AI_CONFIG_ERROR`: Configuration problems
- `AI_GENERATION_ERROR`: Model processing failed

### Support Resources

- **OpenRouter Status**: [status.openrouter.ai](https://status.openrouter.ai)
- **API Documentation**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Model Information**: Check model availability and pricing

## 🔄 Fallback Behavior

The application is designed to work gracefully without AI:

1. **Automatic Fallback**: When AI fails, basic summaries are generated
2. **User Notification**: Clear indication when AI is unavailable
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Cache Preservation**: Existing AI summaries remain available

### Disabling AI Temporarily

```env
AI_ENABLED=false
```

This will:
- Disable all AI processing
- Use basic summary generation
- Preserve existing AI summaries
- Allow easy re-enabling later

---

**Need more help?** Check the main [README.md](../README.md) or create an issue with your specific problem and the debugging information above.
