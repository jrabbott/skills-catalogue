---
name: decision-record
description: Helps create and update project decision records in the configured decisions directory. Use when the user needs to record a project decision, options considered, or the chosen solution.
category:
  - engineering
  - documentation
dependency: memory-settings
---

# Decision Record

## Overview

Record a project decision in a Markdown file. Use the shared memory settings for the storage path. Write all output in ASD-STE100 (Simplified Technical English).

## When to Use

Use this skill when the user needs to:

- Record a project decision
- Capture options that were considered
- Capture the chosen solution
- Update the status of an existing decision record

## Steps

### 1. Load the configuration file

1. Follow the `memory-settings` skill so that `.memory/settings.yml` exists at the workspace root.
2. If that skill stops because the user declines creation, stop this skill.
3. Read `decision_records.directory` from `.memory/settings.yml`.
4. Treat the directory as a path relative to the workspace root.
5. Reject the value if `path.isAbsolute(directory)`.
6. Resolve the directory with `path.resolve(workspaceRoot, directory)`.
7. Reject the value if the resolved path is not equal to `workspaceRoot` and does not start with `workspaceRoot + path.sep`.
8. If the path fails these checks, stop. Tell the user that the path is invalid. Do not create directories or write files.

### 2. Gather context

1. Collect the problem, the options that were considered, and the chosen solution.
2. Ask the user only when this information is not already available in the session.

### 3. Create the decision record

1. Make sure that the resolved decisions directory exists. Create it when it is missing.
2. Draft the record from `assets/decision-template.md`.
3. Choose a short kebab-case title that describes the decision (example: `migrate-to-postgresql`).
4. Write the file as `{directory}/{kebab-case-title}.md`.
5. Do not invent facts that the user did not provide.

### 4. Update an existing decision record

1. If the user asks to update a decision record, change the `Status` field only.
2. Allowed status changes include Draft to Accepted, or Accepted to Superseded by `{other-title}`.
3. Do not rewrite the history of the decision.

## Assets

- `assets/decision-template.md`: Template for decision records.

## Output Standards

- **Language**: All output must follow ASD-STE100 (Simplified Technical English).
- Use short sentences.
- Use clear words.
- Prefer active voice.
- Do not use vague wording.

## Guidelines

- Always follow `memory-settings` before you write a decision record.
- Always use `decision_records.directory` from `.memory/settings.yml`.
- Reject absolute paths and paths that leave the workspace root.
- Use kebab-case titles for file names.
- Change only the `Status` field when you update an existing record.
