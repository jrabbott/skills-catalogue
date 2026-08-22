# Contributing to skills-catalogue

Thanks for helping improve this private Agent Skills catalogue. Skills follow the [Agent Skills](https://agentskills.io/specification) format and are installed with [`npx skills`](https://github.com/vercel-labs/skills).

## Code of conduct

Please read and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

1. Clone the repository (you need access to this private repo).
2. Create a branch from `main`:

   ```bash
   git checkout -b cursor/your-change
   ```

3. Make your changes, then open a pull request against `main`.

## Adding or updating a skill

1. Copy the authoring template:

   ```bash
   cp -R template skills/<skill-name>
   ```

2. Edit `skills/<skill-name>/SKILL.md`:
   - Set `name` to match the folder name (`<skill-name>`).
   - Write a clear `description` covering what the skill does and when to use it.
   - Remove `metadata.internal` (the template uses it so the placeholder is not installable).
   - Fill in agent instructions.

3. Optional supporting paths (see the [specification](https://agentskills.io/specification)):
   - `scripts/` — executable helpers
   - `references/` — docs loaded on demand
   - `assets/` — templates and static resources

4. Validate locally:

   ```bash
   npm ci
   npm run validate
   ```

5. Commit, push, and open a PR. CI runs the same validation on pull requests and pushes to `main`.

### Naming rules

- Folder and `name` must match.
- Use lowercase letters, numbers, and single hyphens only (for example `code-review`).
- Do not start or end with a hyphen, and do not use consecutive hyphens.

## Pull requests

- Keep PRs focused: one skill or one related change set per PR when practical.
- Use the PR template and describe what changed and how to verify it.
- Ensure `npm run validate` passes before requesting review.

## Reporting issues

Use [GitHub Issues](https://github.com/jrabbott/skills-catalogue/issues) with the bug or feature templates. For security concerns, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
