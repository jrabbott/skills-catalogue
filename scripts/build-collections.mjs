#!/usr/bin/env node
/**
 * Build collections/*.json from skill category frontmatter under skills/.
 */
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  COLLECTIONS_DIR,
  ROOT,
  SKILLS_DIR,
  parseCategories,
  parseFrontmatter,
  toPosixPath,
  validateSkill,
  walkSkillMarkdown,
} from "./lib/skills.mjs";

async function main() {
  const files = await walkSkillMarkdown(SKILLS_DIR);
  /** @type {Map<string, string>} */
  const seenByName = new Map();
  /** @type {Map<string, Set<string>>} */
  const byCategory = new Map();

  for (const file of files) {
    const relative = path.relative(ROOT, file);
    const content = await readFile(file, "utf8");
    const frontmatter = parseFrontmatter(content, relative);

    const errors = validateSkill(file, frontmatter);
    if (errors.length) {
      throw new Error(
        `${relative} failed validation:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      );
    }

    const { categories } = parseCategories(frontmatter);
    const { name } = frontmatter;
    const skillPath = toPosixPath(path.relative(ROOT, path.dirname(file)));
    const existingPath = seenByName.get(name);
    if (existingPath) {
      throw new Error(
        `duplicate skill name "${name}": ${existingPath} and ${skillPath}`,
      );
    }
    seenByName.set(name, skillPath);

    for (const category of categories) {
      let skills = byCategory.get(category);
      if (!skills) {
        skills = new Set();
        byCategory.set(category, skills);
      }
      skills.add(name);
    }
  }

  await mkdir(COLLECTIONS_DIR, { recursive: true });

  const written = new Set();
  const categories = [...byCategory.keys()].sort((a, b) =>
    a.localeCompare(b, "en"),
  );

  for (const category of categories) {
    const skills = [...byCategory.get(category)].sort((a, b) =>
      a.localeCompare(b, "en"),
    );
    const collection = {
      name: category,
      skills,
    };
    const fileName = `${category}.json`;
    const filePath = path.join(COLLECTIONS_DIR, fileName);
    const json = `${JSON.stringify(collection, null, 2)}\n`;
    await writeFile(filePath, json, "utf8");
    written.add(fileName);
  }

  const existing = await readdir(COLLECTIONS_DIR);
  for (const entry of existing) {
    if (!entry.endsWith(".json")) {
      continue;
    }
    if (!written.has(entry)) {
      await unlink(path.join(COLLECTIONS_DIR, entry));
    }
  }

  console.log(
    `Wrote ${written.size} collection(s) under ${path.relative(ROOT, COLLECTIONS_DIR)}/.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
