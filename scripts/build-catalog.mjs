#!/usr/bin/env node
/**
 * Build catalog/skills.json from installable skills under skills/.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const CATALOG_DIR = path.join(ROOT, "catalog");
const CATALOG_PATH = path.join(CATALOG_DIR, "skills.json");
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/;

function extractFrontmatter(content, filePath) {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) {
    throw new Error(
      `${filePath}: missing or malformed YAML frontmatter (expected opening and closing --- on their own lines)`,
    );
  }

  return match[1];
}

function parseFrontmatter(content, filePath) {
  const yamlText = extractFrontmatter(content, filePath);

  let data;
  try {
    data = parseYaml(yamlText);
  } catch (error) {
    throw new Error(
      `${filePath}: invalid YAML frontmatter: ${error.message ?? error}`,
    );
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${filePath}: frontmatter must be a YAML mapping`);
  }

  return data;
}

function isInternalSkill(frontmatter) {
  const metadata = frontmatter.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return metadata.internal === true || metadata.internal === "true";
}

async function walkSkillMarkdown(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return acc;
    }
    throw error;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkSkillMarkdown(full, acc);
      continue;
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      acc.push(full);
    }
  }

  return acc;
}

function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}

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

    const { name, description, category } = frontmatter;
    if (typeof name !== "string" || name.length === 0) {
      throw new Error(`${relative}: missing required frontmatter field: name`);
    }
    if (typeof description !== "string" || description.trim().length === 0) {
      throw new Error(
        `${relative}: missing required frontmatter field: description`,
      );
    }

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
