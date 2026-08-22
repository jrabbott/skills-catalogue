#!/usr/bin/env node
/**
 * Validate installable skills under skills/ (nested SKILL.md files).
 * Checks Agent Skills frontmatter conventions used by the Skills CLI.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parseFrontmatter(content, filePath) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    throw new Error(`${filePath}: missing YAML frontmatter opening ---`);
  }

  const end = content.indexOf("\n---", 4);
  if (end === -1) {
    throw new Error(`${filePath}: missing YAML frontmatter closing ---`);
  }

  const yaml = content.slice(4, end).replace(/\r\n/g, "\n");
  const data = {};
  let currentKey = null;
  let indentBlock = null;

  for (const line of yaml.split("\n")) {
    if (indentBlock && /^\s+/.test(line) && line.trim()) {
      // Skip nested block content (e.g. metadata:)
      continue;
    }
    indentBlock = null;

    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const [, key, raw] = match;
    currentKey = key;
    const value = raw.trim();

    if (value === "" || value === "|" || value === ">") {
      indentBlock = key;
      data[key] = "";
      continue;
    }

    data[key] = value.replace(/^["']|["']$/g, "");
  }

  void currentKey;
  return data;
}

async function walkSkillMarkdown(dir, depth = 0, acc = []) {
  if (depth > 3) {
    return acc;
  }

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
      await walkSkillMarkdown(full, depth + 1, acc);
      continue;
    }

    if (entry.isFile() && entry.name === "SKILL.md") {
      acc.push(full);
    }
  }

  return acc;
}

function validateSkill(filePath, frontmatter) {
  const errors = [];
  const skillDir = path.dirname(filePath);
  const folderName = path.basename(skillDir);

  const name = frontmatter.name?.trim();
  const description = frontmatter.description?.trim();

  if (!name) {
    errors.push("missing required frontmatter field: name");
  } else {
    if (name.length > 64) {
      errors.push("name must be at most 64 characters");
    }
    if (!NAME_PATTERN.test(name)) {
      errors.push(
        "name must be lowercase alphanumeric with single hyphens (no leading/trailing/consecutive hyphens)",
      );
    }
    if (name !== folderName) {
      errors.push(`name "${name}" must match folder name "${folderName}"`);
    }
  }

  if (!description) {
    errors.push("missing required frontmatter field: description");
  } else if (description.length > 1024) {
    errors.push("description must be at most 1024 characters");
  }

  return errors;
}

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
