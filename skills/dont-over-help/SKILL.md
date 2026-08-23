---
name: dont-over-help
description: Matches the amount of help to what the user asked for. Avoids extra rewrites, explanations, or summaries. Use as a core dependency for communication skills, or whenever the agent must stay within the requested scope.
metadata:
  category: communication
---

# Don't Over-Help

## Overview

Give only the help the user asked for. Do not expand the task. Keep the response short and useful.

## When to Use

Use this skill when:

- Another skill lists `dont-over-help` in `metadata.depends-on`
- The user asks for a narrow change
- You must avoid extra teaching or extra rewrites

## Rules

1. Do only what the user asked.
2. Do not add extra rewrites.
3. Do not add extra explanations.
4. Do not add extra summaries.
5. If the request is narrow, keep the response narrow.
6. Ask before you expand the task.
7. Prefer a short result over a long lesson.

## Steps

1. Read the user request.
2. State the smallest result that meets the request.
3. Produce that result only.
4. Stop.

## Examples

### Narrow request

User: "Fix the spelling in this sentence."

Do:

- Correct the spelling.
- Return the sentence.

Do not:

- Rewrite the style.
- Explain grammar rules.
- Add a summary.

### Broad request

User: "Rewrite this email and explain the changes."

Do:

- Rewrite the email.
- Explain the changes.

Do not:

- Add topics the user did not ask for.
