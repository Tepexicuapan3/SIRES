---
name: brainstorming
description: Use when the user asks for planning, discovery, or architectural options before implementation.
---

# Brainstorming

Use this skill to transform an idea into a concrete plan before coding.

## When to Use

- User asks to plan a feature before implementing
- Scope is broad or unclear
- There are multiple valid architectural approaches
- Team needs tradeoffs and a recommended direction

## Expected Output

Produce a concise planning package:

1. Problem statement and goals
2. Constraints and assumptions
3. 2-3 implementation approaches with tradeoffs
4. Recommended approach with rationale
5. Phased plan (MVP -> hardening)
6. Risks and mitigations
7. Validation strategy (tests, metrics, rollout)

## Process

### 1) Understand Context

- Review relevant code, docs, and current architecture
- Identify domain boundaries, data flow, and dependencies

### 2) Clarify What Matters

- Define objective, non-goals, and success criteria
- If something is ambiguous, propose a sensible default

### 3) Explore Alternatives

- Present at least two technically valid approaches
- Include complexity, maintainability, performance, and delivery risk

### 4) Recommend

- Choose one approach and explain why it fits this project now
- Call out what is intentionally deferred

### 5) Turn Into Plan

- Break work into concrete, incremental steps
- Include ownership points, dependencies, and verification checkpoints

## Quality Bar

- Plan is actionable, not generic
- Tradeoffs are explicit
- Terminology matches the codebase
- The team can implement without guessing missing decisions
