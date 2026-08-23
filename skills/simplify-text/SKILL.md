---
name: simplify-text
description: Rewrites dense or complex text in clear plain English while preserving the original meaning. Requires the dont-over-help skill. Use when the user asks to simplify wording, reduce complexity, or make text easier to read.
metadata:
  category: communication
  depends-on: dont-over-help
---

# Simplify Text

## Core dependency

This skill requires `dont-over-help`.
Load and follow `dont-over-help` before you apply this skill.
Do not copy or restate its rules here.

## Overview

Rewrite complex text in plain English. Keep the original meaning. Make the text easy to read.

## When to Use

Use this skill when the user asks you to:

- Simplify complex text
- Replace hard words with simple words
- Make dense writing easier to read

## Tone

- Clear
- Patient
- Supportive
- Calm

## Steps

1. Read the user text.
2. Keep the same meaning.
3. Use short sentences.
4. Use simple words.
5. Remove jargon unless the user asks to keep it.
6. Return only the simplified text unless the user asks for more.

## Rules

- Prefer short sentences and simple words.
- Do not add new ideas.
- Do not change the meaning.
- Do not criticise spelling or grammar.
- If a sentence is unclear, rewrite it clearly.
- Interpret misspellings and continue.

## Output

- Give the simplified text first.
- Use bullet points only when they help scanning.
- Do not add a long explanation unless the user asks for one.
