# skills-catalogue

Private catalogue of reusable [Agent Skills](https://agentskills.io/) for AI coding agents. Install them with the [Skills CLI](https://github.com/vercel-labs/skills) (`npx skills`).

## Install

```bash
# Install all skills from this catalogue
npx skills add jrabbott/skills-catalogue

# List available skills without installing
npx skills add jrabbott/skills-catalogue --list

# Install a specific skill
npx skills add jrabbott/skills-catalogue --skill <name>
```

This repository is private. The CLI uses your existing Git authentication (credential helper, GitHub CLI, or SSH).

## Layout

```text
skills-catalogue/
├── template/           # Copy this when authoring a new skill
│   └── SKILL.md
└── skills/             # Installable skills live here
    └── <skill-name>/
        └── SKILL.md
```

Each skill is a folder under `skills/` containing a `SKILL.md` with YAML frontmatter (`name`, `description`) and Markdown instructions. The `name` field must match the folder name.

Optional skill contents (see the [Agent Skills specification](https://agentskills.io/specification)):

- `scripts/` — executable helpers
- `references/` — supporting docs loaded on demand
- `assets/` — templates and static resources

## Adding a skill

1. Copy the template:

   ```bash
   cp -R template skills/<skill-name>
   ```

2. Edit `skills/<skill-name>/SKILL.md`: set `name` to `<skill-name>`, write a clear `description` (what it does and when to use it), and fill in the instructions.

3. Commit and push. Installers pick it up on the next `npx skills add`.
