---
name: memory-settings
description: Checks for and creates the shared project memory configuration at .memory/settings.yml. Use when another skill needs this file, or when the user asks to set up memory settings.
category: core
---

# Memory Settings

## Overview

Make sure that `.memory/settings.yml` exists at the workspace root. Create the file with default values only when the user accepts.

## When to Use

Use this skill when:

- Another skill needs `.memory/settings.yml`
- The user asks to set up or check memory settings

## Steps

### 1. Check for the configuration file

1. Look for `.memory/settings.yml` at the workspace root.
2. If the file exists, read it and stop. Do not overwrite it.
3. If the file is missing, tell the user that the configuration file is missing.
4. Ask the user if you must create the file with default settings.
5. If the user declines, stop. Do not invent settings.

### 2. Create the default configuration

1. If the user accepts, run this skill's `scripts/create-config.mjs` from the workspace root.
2. Example: `node <path-to-this-skill>/scripts/create-config.mjs`.
3. The script creates `.memory/` when needed.
4. The script creates `.memory/settings.yml` from the default template.
5. The script does not overwrite an existing file.

### 3. Confirm the schema

Read these keys from `.memory/settings.yml`:

| Key | Meaning |
| --- | --- |
| `documentation_folders` | List of folders that hold project documentation. Paths are relative to the workspace root. |
| `decision_records.directory` | Folder that holds decision record files. The path is relative to the workspace root. |

## Default configuration

```yaml
# Project memory settings (paths relative to workspace root)
documentation_folders:
  - docs

decision_records:
  directory: .memory/decisions
```

## Guidelines

- Do not overwrite an existing `.memory/settings.yml`.
- Create the file only when the user accepts.
- Resolve all configured paths relative to the workspace root.
- Keep instructions and messages in ASD-STE100 (Simplified Technical English).
