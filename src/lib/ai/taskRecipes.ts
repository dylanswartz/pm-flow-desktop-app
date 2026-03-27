/**
 * PM Flow — Task Recipes
 * Built-in reusable AI task transformations.
 */

import { type TaskRecipe } from './types';

export const TASK_RECIPES: TaskRecipe[] = [
  {
    id: 'refine-context',
    name: 'Refine Context',
    description: 'Improve clarity, structure, and completeness of context documents',
    systemPrompt: `You are a senior technical product manager reviewing context documents. Your job is to:
1. Improve clarity and structure
2. Fill in obvious gaps
3. Remove redundancy
4. Ensure consistent formatting
5. Add actionable specificity where vague

Output the refined document in clean markdown format. Preserve the original structure but improve it.`,
    userPromptTemplate: 'Please refine the following context document:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Preserve original intent', 'Keep markdown formatting', 'Add frontmatter if missing'],
  },
  {
    id: 'generate-prd',
    name: 'Generate PRD',
    description: 'Generate a Product Requirements Document from context',
    systemPrompt: `You are a senior product manager creating a comprehensive PRD. Generate a well-structured PRD that includes:
1. Overview & Problem Statement
2. Goals & Success Metrics
3. User Stories
4. Requirements (Functional & Non-Functional)
5. Out of Scope
6. Technical Considerations
7. Open Questions

Format as clean markdown with YAML frontmatter (title, type: prd, domain).`,
    userPromptTemplate: 'Generate a PRD based on the following context:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Include frontmatter', 'Be specific and actionable', 'Include success metrics'],
  },
  {
    id: 'generate-build-prompt',
    name: 'Generate Build Prompt',
    description: 'Create a detailed engineering build prompt from product context',
    systemPrompt: `You are converting product context into a detailed engineering build prompt. Create a prompt that an AI coding assistant can use to implement the described feature. Include:
1. Clear objective
2. Technical requirements
3. Architecture constraints
4. Acceptance criteria
5. Edge cases to handle
6. File structure suggestions

Be extremely specific and technical.`,
    userPromptTemplate: 'Generate a build prompt for an AI coding assistant from this context:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Technical and specific', 'Include file structure', 'Include acceptance criteria'],
  },
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Create a concise summary of context documents',
    systemPrompt: `You are summarizing product context. Create a clear, concise summary that captures:
1. Key points and decisions
2. Open questions
3. Technical constraints
4. Next steps

Keep it brief but comprehensive.`,
    userPromptTemplate: 'Summarize the following context:\n\n{bundle}',
    outputFormat: 'markdown',
  },
  {
    id: 'find-gaps',
    name: 'Find Gaps',
    description: 'Identify missing information, contradictions, and weak areas',
    systemPrompt: `You are a critical reviewer analyzing product context for completeness. Identify:
1. Missing information or undefined areas
2. Contradictions between sections
3. Vague or ambiguous requirements
4. Missing edge cases
5. Unstated assumptions
6. Technical risks not addressed

Format as a structured list with severity indicators.`,
    userPromptTemplate: 'Analyze the following context for gaps and issues:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Be thorough', 'Rate severity', 'Suggest what to add'],
  },
  {
    id: 'convert-notes',
    name: 'Convert Notes to Context',
    description: 'Transform unstructured notes into structured context documents',
    systemPrompt: `You are converting unstructured notes into a clean, structured context document. Apply:
1. YAML frontmatter (title, type, domain, tags)
2. Clear heading hierarchy
3. Structured sections
4. Clean formatting
5. Remove duplicates and organize logically

Output a well-structured markdown document ready for PM Flow.`,
    userPromptTemplate: 'Convert these notes into a structured context document:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Add frontmatter', 'Use heading hierarchy', 'Remove duplicates'],
  },
  {
    id: 'generate-figma-prompt',
    name: 'Generate Figma Prompt',
    description: 'Create a detailed prompt for Figma AI / design tools',
    systemPrompt: `You are creating a detailed design prompt for a UI/UX designer or AI design tool. From the product context, generate:
1. Screen/component description
2. Layout requirements
3. User interaction flows
4. Visual style guidelines
5. Content requirements
6. Responsive behavior
7. Accessibility requirements

Be specific about visual details and interactions.`,
    userPromptTemplate: 'Generate a Figma/design prompt from this context:\n\n{bundle}',
    outputFormat: 'markdown',
    constraints: ['Be visually specific', 'Include interaction details', 'Mention accessibility'],
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    description: 'Write your own prompt and instructions',
    systemPrompt: 'You are a helpful AI assistant for product management tasks. Follow the user\'s instructions carefully.',
    userPromptTemplate: '{bundle}',
    outputFormat: 'markdown',
  },
];

/**
 * Get a task recipe by ID.
 */
export function getRecipe(id: string): TaskRecipe | undefined {
  return TASK_RECIPES.find(r => r.id === id);
}

/**
 * Apply a recipe template, replacing {bundle} with actual content.
 */
export function applyRecipeTemplate(recipe: TaskRecipe, bundle: string): string {
  return recipe.userPromptTemplate.replace('{bundle}', bundle);
}
