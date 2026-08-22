#!/usr/bin/env node
/**
 * Validate installable skills under skills/ (nested SKILL.md files).
 * Checks Agent Skills frontmatter conventions used by the Skills CLI.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
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

function isInternalSkill(frontmatter) {
  const metadata = frontmatter.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return metadata.internal === true || metadata.internal === "true";
}

function validateSkill(filePath, frontmatter) {
  const errors = [];
  const skillDir = path.dirname(filePath);
  const folderName = path.basename(skillDir);

  if (isInternalSkill(frontmatter)) {
    errors.push(
      'remove metadata.internal from installable skills under skills/ (template-only marker)',
    );
  }

  const { name, description } = frontmatter;

  if (name === undefined || name === null || name === "") {
    errors.push("missing required frontmatter field: name");
  } else if (typeof name !== "string") {
    errors.push(`name must be a string (got ${typeof name})`);
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

  if (description === undefined || description === null || description === "") {
    errors.push("missing required frontmatter field: description");
  } else if (typeof description !== "string") {
    errors.push(`description must be a string (got ${typeof description})`);
  } else if (description.trim().length === 0) {
    errors.push("description must be a non-empty string");
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
