#!/usr/bin/env node
/**
 * Validate installable skills under skills/ (nested SKILL.md files).
 * Checks Agent Skills frontmatter conventions used by the Skills CLI.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  ROOT,
  SKILLS_DIR,
  parseFrontmatter,
  validateSkill,
  walkSkillMarkdown,
} from "./lib/skills.mjs";

async function main() {
  const skillsStat = await stat(SKILLS_DIR).catch(() => null);
  if (!skillsStat?.isDirectory()) {
    console.error(`Missing skills directory: ${SKILLS_DIR}`);
    process.exit(1);
  }

  const files = await walkSkillMarkdown(SKILLS_DIR);
  if (files.length === 0) {
    console.log("No skills found under skills/ (empty catalogue is OK).");
    return;
  }

  let failed = 0;
  for (const file of files.sort()) {
    const relative = path.relative(ROOT, file);
    try {
      const content = await readFile(file, "utf8");
      const frontmatter = parseFrontmatter(content, relative);
      const errors = validateSkill(file, frontmatter);
      if (errors.length) {
        failed += 1;
        console.error(`FAIL ${relative}`);
        for (const error of errors) {
          console.error(`  - ${error}`);
        }
      } else {
        console.log(`OK   ${relative}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${relative}`);
      console.error(`  - ${error.message ?? error}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} skill(s) failed validation.`);
    process.exit(1);
  }

  console.log(`\nValidated ${files.length} skill(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
