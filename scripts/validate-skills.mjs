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
  parseDependencies,
  parseFrontmatter,
  toPosixPath,
  validateDependencyGraph,
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
  /** @type {Map<string, string>} */
  const seenByName = new Map();
  /** @type {{ name: string, dependencies: string[], relative: string }[]} */
  const skillGraph = [];

  for (const file of files.sort()) {
    const relative = path.relative(ROOT, file);
    const skillPath = toPosixPath(path.relative(ROOT, path.dirname(file)));
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
        const { name } = frontmatter;
        const existingPath = seenByName.get(name);
        if (existingPath) {
          failed += 1;
          console.error(`FAIL ${relative}`);
          console.error(
            `  - duplicate skill name "${name}": ${existingPath} and ${skillPath}`,
          );
        } else {
          console.log(`OK   ${relative}`);
          seenByName.set(name, skillPath);
          const { dependencies } = parseDependencies(frontmatter);
          skillGraph.push({
            name,
            dependencies,
            relative,
          });
        }
      }
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${relative}`);
      console.error(`  - ${error.message ?? error}`);
    }
  }

  if (failed === 0 && skillGraph.length > 0) {
    const graphErrors = validateDependencyGraph(skillGraph);
    if (graphErrors.length) {
      failed += 1;
      console.error("FAIL dependency graph");
      for (const error of graphErrors) {
        console.error(`  - ${error}`);
      }
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed validation.`);
    process.exit(1);
  }

  console.log(`\nValidated ${files.length} skill(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
