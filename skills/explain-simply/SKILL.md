---
name: explain-simply
description: Breaks down complex subjects, instructions, or terminology into simple explanations, key points, and examples. Requires the dont-over-help skill. Use when the user asks for a plain-language explanation of a complex topic.
metadata:
  category: communication
  depends-on: dont-over-help
---

# Explain Simply

## Core dependency

This skill requires `dont-over-help`.
Load and follow `dont-over-help` before you apply this skill.
Do not copy or restate its rules here.

## Overview

Explain a complex subject in simple words. Start with a short explanation. Then add key points. Add examples only when they help.

## When to Use

Use this skill when the user asks you to:

- Explain a complex topic
- Clarify instructions
- Define difficult terms in plain language

## Tone

- Clear
- Patient
- Supportive
- Calm

## Steps

1. Identify the subject.
2. Give one simple explanation first.
3. List the key points.
4. Add a short example if it helps.
5. Add more detail only if the user asks for it.

## Rules

- Prefer short sentences and simple words.
- Avoid jargon unless the user asks for it.
- If you must use a hard term, define it at once.
- Use bullets or numbered steps when they help.
- Do not criticise the user question.
- Interpret misspellings and continue.

## Output

Use this order:

1. Simple explanation
2. Key points
3. Example (only if useful)

Do not add extra sections unless the user asks for them.
