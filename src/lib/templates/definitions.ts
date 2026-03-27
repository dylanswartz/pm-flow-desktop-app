export type TemplateType = 'context' | 'notes' | 'iterations' | 'shared-context' | 'prompt' | 'daily';

export interface TemplateDefinition {
  id: TemplateType;
  name: string;
  content: string;
}

export const TEMPLATE_DEFINITIONS: Record<TemplateType, TemplateDefinition> = {
  'context': {
    id: 'context',
    name: 'Core Context',
    content: `---
title: <Title>
type: context
domain: <domain>
area: <area>
status: active
tags: []
updated: <date>
---

# TLDR
<1–3 sentence summary of what this is>

# Problem Definition
What problem are we solving?
Why does it matter?

# User & Use Case Context
Who is the user?
What are they trying to do?

# Current State
How does this work today?
What’s broken?

# Desired Outcome
What does success look like?
User + system level

# Constraints & Guardrails
- technical constraints
- product constraints
- design constraints

# Open Questions
- unknowns
- risks

# Iteration Log
## v0
Initial idea

# Agent Instructions
How should an AI operate on this context?
What should it produce?
`
  },
  'notes': {
    id: 'notes',
    name: 'Raw Thinking',
    content: `---
title: <Title>
type: notes
domain: <domain>
area: <area>
updated: <date>
---

# Notes

## Ideas
- 

## Observations
- 

## Conversations
- 

## Links / References
- 

## Rough Thoughts
- 
`
  },
  'iterations': {
    id: 'iterations',
    name: 'Decision Log',
    content: `---
title: <Title>
type: iterations
domain: <domain>
area: <area>
updated: <date>
---

# Iteration Log

## v0
What was the starting point?

## v1
What changed?
Why?

## v2
What did we learn?

## Next
What needs to happen next?
`
  },
  'shared-context': {
    id: 'shared-context',
    name: 'Domain Memory',
    content: `---
title: <Title>
type: shared-context
domain: <domain>
updated: <date>
---

# Overview

# Key Concepts
- 

# System Model
- 

# Terminology
- 

# Patterns
- 

# Notes
- 
`
  },
  'prompt': {
    id: 'prompt',
    name: 'AI Tasks',
    content: `---
title: <Title>
type: prompt
domain: <domain>
area: <area>
updated: <date>
---

# Task

What should the AI do?

# Input

What context is expected?

# Instructions

- constraints
- expectations
- output format

# Output

What should be produced?
`
  },
  'daily': {
    id: 'daily',
    name: 'Daily Log',
    content: `---
title: <YYYY-MM-DD>
type: daily
date: <YYYY-MM-DD>
updated: <date>
---

# <YYYY-MM-DD>

## Thoughts
-

## Work in Progress
-

## AI Outputs
-

## Decisions
-

## Ideas to Explore
-

## TODO
-
`
  }
};
