#!/usr/bin/env node
/**
 * Build catalog/skills.json from installable skills under skills/.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ROOT,
  SKILLS_DIR,
  isInternalSkill,
  parseFrontmatter,
  toPosixPath,
  validateSkill,
  walkSkillMarkdown,
} from "./lib/skills.mjs";

const CATALOG_DIR = path.join(ROOT, "catalog");
const CATALOG_PATH = path.join(CATALOG_DIR, "skills.json");

async function main() {
  const files = await walkSkillMarkdown(SKILLS_DIR);
  const skills = [];

  for (const file of files) {
    const relative = path.relative(ROOT, file);
    const content = await readFile(file, "utf8");
    const frontmatter = parseFrontmatter(content, relative);

    if (isInternalSkill(frontmatter)) {
      continue;
    }

    const errors = validateSkill(file, frontmatter);
    if (errors.length) {
      throw new Error(
        `${relative} failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      );
    }

    const { name, description, category } = frontmatter;
    const entry = {
      name,
      description,
    };

    if (typeof category === "string" && category.trim().length > 0) {
      entry.category = category;
    }

    entry.path = toPosixPath(path.relative(ROOT, path.dirname(file)));
    skills.push(entry);
  }

  const byName = new Map();
  for (const skill of skills) {
    const existing = byName.get(skill.name);
    if (existing) {
      throw new Error(
        `duplicate skill name "${skill.name}": ${existing.path} and ${skill.path}`,
      );
    }
    byName.set(skill.name, skill);
  }

  skills.sort((a, b) => {
    const byNameCmp = a.name.localeCompare(b.name, "en");
    if (byNameCmp !== 0) return byNameCmp;
    return a.path.localeCompare(b.path, "en");
  });

  const catalog = {
    schemaVersion: 1,
    skills,
  };

  await mkdir(CATALOG_DIR, { recursive: true });
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  await writeFile(CATALOG_PATH, json, "utf8");

  console.log(
    `Wrote ${path.relative(ROOT, CATALOG_PATH)} (${skills.length} skill(s)).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
