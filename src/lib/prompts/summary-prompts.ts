// AI Prompt Templates for Worklog Summarization
// Provides structured prompts for consistent AI-generated summaries

import { GitCommit } from '@/types/git';

export interface PromptTemplate {
  system: string;
  user: string;
  variables: Record<string, string>;
}

export interface PromptContext {
  commits: GitCommit[];
  author: string;
  date: Date;
  thaiDate: string;
  repositoryUrl?: string;
}

/**
 * Default system prompt for worklog summarization
 */
export const DEFAULT_SYSTEM_PROMPT = `You are a technical writer creating daily work summaries from Git commits.

Your role:
- Transform technical Git commits into coherent work narratives
- Group related changes into logical work items
- Explain technical work in business-friendly terms
- Maintain accuracy to the original commit content
- Use Thai Buddhist calendar format for dates

Guidelines:
- Be concise but informative
- Focus on what was accomplished, not how
- Group related commits together
- Use clear, professional language
- Preserve the Thai date format provided
- Create bullet points for each major work item
- Avoid technical jargon when possible`;

/**
 * Generate user prompt for commit summarization
 */
export function generateCommitSummaryPrompt(context: PromptContext): string {
  const { commits, author, thaiDate } = context;
  
  const commitList = commits.map(commit => {
    const shortHash = commit.hash.substring(0, 7);
    const time = commit.date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `- ${commit.message} (${shortHash} at ${time})`;
  }).join('\n');

  return `Transform these Git commits into a coherent daily work summary:

Date: ${thaiDate}
Author: ${author}
Total commits: ${commits.length}

Commits:
${commitList}

Requirements:
1. Group related commits into logical work items
2. Explain technical changes in business terms
3. Maintain accuracy to original commit content
4. Format date as Thai Buddhist calendar
5. Keep summary concise but informative

Output format:
${thaiDate}
- [Work item 1 description]
- [Work item 2 description]
- [Additional items as needed]`;
}

/**
 * Generate prompt for feature-focused summarization
 */
export function generateFeatureSummaryPrompt(context: PromptContext): string {
  const { commits, author, thaiDate } = context;
  
  // Analyze commits for feature patterns
  const features = commits.filter(c => 
    c.message.toLowerCase().includes('feat:') || 
    c.message.toLowerCase().includes('add') ||
    c.message.toLowerCase().includes('implement')
  );
  
  const fixes = commits.filter(c => 
    c.message.toLowerCase().includes('fix:') || 
    c.message.toLowerCase().includes('bug') ||
    c.message.toLowerCase().includes('resolve')
  );
  
  const refactors = commits.filter(c => 
    c.message.toLowerCase().includes('refactor:') || 
    c.message.toLowerCase().includes('improve') ||
    c.message.toLowerCase().includes('optimize')
  );

  const commitList = commits.map(commit => {
    const shortHash = commit.hash.substring(0, 7);
    return `- ${commit.message} (${shortHash})`;
  }).join('\n');

  return `Create a feature-focused work summary from these Git commits:

Date: ${thaiDate}
Author: ${author}

Analysis:
- Features: ${features.length} commits
- Bug fixes: ${fixes.length} commits  
- Refactoring: ${refactors.length} commits
- Other: ${commits.length - features.length - fixes.length - refactors.length} commits

All commits:
${commitList}

Requirements:
1. Organize by work type (features, fixes, improvements)
2. Highlight business value of each change
3. Use clear, non-technical language
4. Maintain Thai date format
5. Show progression of work throughout the day

Output format:
${thaiDate}
- [Major feature work]
- [Bug fixes and stability improvements]  
- [Code quality and performance enhancements]
- [Other contributions]`;
}

/**
 * Generate prompt for time-based summarization
 */
export function generateTimeBasedSummaryPrompt(context: PromptContext): string {
  const { commits, author, thaiDate } = context;
  
  // Sort commits by time and group by time periods
  const sortedCommits = [...commits].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const morning = sortedCommits.filter(c => c.date.getHours() < 12);
  const afternoon = sortedCommits.filter(c => c.date.getHours() >= 12 && c.date.getHours() < 18);
  const evening = sortedCommits.filter(c => c.date.getHours() >= 18);

  const formatTimeGroup = (commits: GitCommit[], period: string) => {
    if (commits.length === 0) return '';
    return `\n${period}:\n${commits.map(c => `  - ${c.message} (${c.date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })})`).join('\n')}`;
  };

  const timeBreakdown = [
    formatTimeGroup(morning, 'Morning (00:00-11:59)'),
    formatTimeGroup(afternoon, 'Afternoon (12:00-17:59)'),
    formatTimeGroup(evening, 'Evening (18:00-23:59)')
  ].filter(Boolean).join('\n');

  return `Create a time-based work summary showing the progression of work throughout the day:

Date: ${thaiDate}
Author: ${author}
Total commits: ${commits.length}

Work timeline:${timeBreakdown}

Requirements:
1. Show the flow of work throughout the day
2. Identify patterns and work focus areas
3. Highlight productivity peaks and major accomplishments
4. Use business-friendly language
5. Maintain Thai date format

Output format:
${thaiDate}
- [Morning work focus and achievements]
- [Afternoon development and progress]
- [Evening completion and wrap-up]
- [Overall daily accomplishments]`;
}

/**
 * Generate prompt for minimal/concise summarization
 */
export function generateConciseSummaryPrompt(context: PromptContext): string {
  const { commits, author, thaiDate } = context;
  
  // Extract key action words
  const keyActions = commits.map(commit => {
    const message = commit.message.toLowerCase();
    if (message.includes('feat:') || message.includes('add')) return 'Added';
    if (message.includes('fix:') || message.includes('bug')) return 'Fixed';
    if (message.includes('refactor:') || message.includes('improve')) return 'Improved';
    if (message.includes('docs:') || message.includes('documentation')) return 'Documented';
    if (message.includes('test:')) return 'Tested';
    return 'Updated';
  });

  const commitList = commits.map((commit, index) => {
    const action = keyActions[index];
    const shortHash = commit.hash.substring(0, 7);
    return `- ${action}: ${commit.message} (${shortHash})`;
  }).join('\n');

  return `Create a concise, high-level work summary (maximum 3 bullet points):

Date: ${thaiDate}
Author: ${author}
Commits: ${commits.length}

Detailed commits:
${commitList}

Requirements:
1. Maximum 3 bullet points
2. Focus on major accomplishments only
3. Use action-oriented language
4. Maintain Thai date format
5. Each point should represent significant work

Output format:
${thaiDate}
- [Major accomplishment 1]
- [Major accomplishment 2]  
- [Major accomplishment 3 (if applicable)]`;
}

/**
 * Get appropriate prompt template based on commit characteristics
 */
export function getOptimalPromptTemplate(context: PromptContext): string {
  const { commits } = context;
  
  // Choose template based on commit count and patterns
  if (commits.length <= 3) {
    return generateConciseSummaryPrompt(context);
  }
  
  if (commits.length >= 10) {
    return generateTimeBasedSummaryPrompt(context);
  }
  
  // Check for feature-heavy work
  const featureCommits = commits.filter(c => 
    c.message.toLowerCase().includes('feat:') || 
    c.message.toLowerCase().includes('add') ||
    c.message.toLowerCase().includes('implement')
  );
  
  if (featureCommits.length >= commits.length * 0.5) {
    return generateFeatureSummaryPrompt(context);
  }
  
  // Default to standard summarization
  return generateCommitSummaryPrompt(context);
}

/**
 * Prompt template configurations for different scenarios
 */
export const PROMPT_TEMPLATES = {
  default: {
    system: DEFAULT_SYSTEM_PROMPT,
    generator: generateCommitSummaryPrompt
  },
  feature: {
    system: DEFAULT_SYSTEM_PROMPT,
    generator: generateFeatureSummaryPrompt
  },
  timeBased: {
    system: DEFAULT_SYSTEM_PROMPT,
    generator: generateTimeBasedSummaryPrompt
  },
  concise: {
    system: DEFAULT_SYSTEM_PROMPT,
    generator: generateConciseSummaryPrompt
  },
  optimal: {
    system: DEFAULT_SYSTEM_PROMPT,
    generator: getOptimalPromptTemplate
  }
} as const;

export type PromptTemplateType = keyof typeof PROMPT_TEMPLATES;
