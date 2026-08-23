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
├── skills/             # Installable skills live here
│   └── <skill-name>/
│       └── SKILL.md
├── catalogue/
│   └── skills.json     # Generated catalogue index (commit after changes)
└── collections/        # Generated category bundles (commit after changes)
    └── <category>.json
```

Each skill is a folder under `skills/` containing a `SKILL.md` with YAML frontmatter (`name`, `description`, `metadata`) and Markdown instructions. The `name` field must match the folder name.

`metadata.category` is required: a single kebab-case label, or a YAML list of labels (lowercase letters and single hyphens only; no digits). A skill may belong to multiple categories:

```yaml
metadata:
  category: general
  # or
  category:
    - engineering
    - documentation
```

Optional `metadata.depends-on` names other installable skills the same way (string or YAML list). Collections are generated from category labels and always include transitive dependencies, so installers pull a complete bundle.

Optional skill contents (see the [Agent Skills specification](https://agentskills.io/specification)):

- `scripts/` — executable helpers
- `references/` — supporting docs loaded on demand
- `assets/` — templates and static resources

## Adding a skill

1. Copy the template:

   ```bash
   cp -R template skills/<skill-name>
   ```

2. Edit `skills/<skill-name>/SKILL.md`: set `name` to `<skill-name>`, write a clear `description` (what it does and when to use it), set `metadata.category`, optionally set `metadata.depends-on`, remove `metadata.internal` (the template uses it so the placeholder is not installable), and fill in the instructions.

3. Regenerate the catalogue and collections, then commit the skill plus generated files:

   ```bash
   npm run build
   ```

4. Commit and push. Installers pick it up on the next `npx skills add`.

For full contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Validate

```bash
npm ci
npm run validate
npm run build
```

CI runs the same checks on pull requests and pushes to `main`, and fails if `catalogue/skills.json` or `collections/` are out of date.

## Community

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [MIT License](LICENSE)
