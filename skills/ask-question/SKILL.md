---
name: ask-question
description: Answers questions using only repository READMEs and configured documentation folders. Prefers the filesystem MCP server when available. Use when the user asks about project processes, local setup, assumptions, or existing documentation.
category: documentation
---

# Ask Question

## Overview

Answer user questions about the project. Use only information that exists in the repository. Prefer the filesystem MCP server. If that server is not available, ask the user to stop or to continue with built-in file tools.

## When to Use

Use this skill when the user asks about:

- Project processes
- Local setup
- Assumptions
- Existing documentation

## Steps

### 1. Load the configuration file

1. Look for `.ask-question.yaml` at the workspace root.
2. If the file is missing, tell the user that the configuration file is missing.
3. Ask the user if you must create the file with default settings.
4. If the user accepts, run this skill's `scripts/create-config.mjs` from the workspace root (so `.ask-question.yaml` is created there). Example: `node <path-to-this-skill>/scripts/create-config.mjs`.
5. If the user declines, stop. Do not invent an answer.
6. Read `documentation_folders` from the configuration file.
7. Treat each entry in `documentation_folders` as a path relative to the workspace root.
8. Resolve each folder as `join(workspaceRoot, folderPath)` before you search.

### 2. Select the query method

1. Check if the filesystem MCP server is available.
2. Probe with `list_allowed_directories`.
3. If the probe fails, treat the filesystem MCP server as not available.
4. If the probe succeeds, confirm that the workspace root is inside at least one allowed directory.
5. Confirm that each resolved `documentation_folders` path is also inside an allowed directory.
6. Treat the server as available only if the probe succeeds and all required paths are inside allowed directories.
7. If any required path is outside allowed directories, treat the filesystem MCP server as not usable for this skill.

#### If the filesystem MCP server is available

1. Use read-only MCP tools only.
2. Do not call write, edit, or move tools.
3. Use these tools:

| Purpose | MCP tool |
| --- | --- |
| Confirm access roots | `list_allowed_directories` |
| Find README files and documents by name | `search_files` |
| Browse a documentation folder | `list_directory` or `directory_tree` |
| Read selected files | `read_text_file` or `read_multiple_files` |

#### If the filesystem MCP server is not available or not usable

1. Tell the user that `@modelcontextprotocol/server-filesystem` is not available or cannot access the workspace and documentation folders in this session.
2. Point the user to `references/mcp-filesystem-setup.md` for setup steps.
3. Ask the user to choose one option:
   - **Stop** — End this skill. Do not answer from guesswork.
   - **Continue** — Use the host's built-in file tools for discovery and reading (`glob`, `grep`, and a file-reading tool such as `read` or `view`) on README files and configured documentation folders.
4. Do not use the built-in method until the user chooses **Continue**.
5. If the user chooses **Stop**, end this skill.

### 3. Discover documents

1. Find all README files in the repository. Include common variants such as `README.md`.
2. Resolve each folder in `documentation_folders` relative to the workspace root. Then search each resolved folder.
3. Search for terms from the user question.
4. Check other folders only when the question clearly points to them.
5. Cite every source that you use.
6. Do not use external knowledge.

### 4. Assess relevance

1. Prefer files that have YAML frontmatter.
2. Read these fields when they exist:
   - `title`
   - `tags` or `keywords`
   - `description`
3. Use these fields to select relevant files before you read full content.

### 5. Write a grounded answer

1. Base the answer only on text found in the repository.
2. Cite the file path for each fact.
3. Do not guess.
4. Do not use general external knowledge as project fact.
5. If you cannot find the answer, state:

> I could not find information regarding [topic] in the repository documentation.

## Example Workflow

1. The user asks: "How do I set up the local development environment?"
2. You load `.ask-question.yaml` and read `documentation_folders`.
3. You confirm that the filesystem MCP server is available and can access the workspace root and documentation folders.
4. You search for `setup`, `install`, and `environment` in README files and in `docs/`.
5. You find `docs/setup-guide.md` and `README.md`.
6. You read the frontmatter, then the relevant sections.
7. You answer with steps from those files and cite each path.

## Guidelines

- Keep answers grounded in repository content.
- Prefer the filesystem MCP server when it is available.
- Always search README files.
- Always respect `documentation_folders` from the configuration file.
- Stop when configuration is missing and the user declines creation.
- Resolve `documentation_folders` paths relative to the workspace root.
- Stop when the filesystem MCP server is missing or not usable and the user chooses stop.
- On the built-in fallback path, use the host's file-reading tool (`read`, `view`, or equivalent).
