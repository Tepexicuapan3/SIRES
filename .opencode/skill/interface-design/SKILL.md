---
name: interface-design
description: Use when creating new UI interfaces, layout direction, visual hierarchy, and interaction patterns before implementation.
---

# Interface Design

Design interfaces intentionally so they feel crafted for SIRES, not generic templates.

## When to Use

- Creating new screens or major UI sections
- Defining layout/hierarchy before coding components
- Designing visual language for a feature (density, spacing, emphasis)
- Choosing interaction patterns for forms, tables, and workflows

## Deliverables

Before implementation, provide:

1. User intent and task flow
2. Layout structure and information hierarchy
3. Visual direction (tokens, spacing, depth strategy)
4. Interaction states (default/hover/focus/disabled/loading/error/empty)
5. Accessibility notes (contrast, keyboard flow, semantics)

## Process

### 1) Frame the Problem
- Who is the user?
- What must they complete quickly and safely?
- What can be deferred?

### 2) Define the Interface Model
- Primary region (main task)
- Secondary region (supporting context)
- Feedback region (validation, alerts, progress)

### 3) Establish Visual System
- Reuse project tokens from `frontend/src/styles/theme.css`
- Keep spacing consistent with a clear base rhythm
- Pick one depth strategy (borders or subtle shadows) and stay consistent

### 4) Validate the Design
- Check hierarchy by scanning order
- Verify forms and critical actions are obvious
- Ensure all key states are present

## Quality Checklist

- The UI matches SIRES style and domain context
- No generic dashboard boilerplate
- Error and empty states are defined
- Accessibility and keyboard behavior are considered
- Component boundaries are clear for implementation
