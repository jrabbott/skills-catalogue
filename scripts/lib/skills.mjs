/**
 * Shared helpers for skill discovery, frontmatter parsing, and validation.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const SKILLS_DIR = path.join(ROOT, "skills");
export const COLLECTIONS_DIR = path.join(ROOT, "collections");

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Lowercase letters and single hyphens only (no digits or other characters). */
export const CATEGORY_PATTERN = /^[a-z]+(?:-[a-z]+)*$/;
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

export function parseFrontmatter(content, filePath) {
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

export async function walkSkillMarkdown(dir, acc = []) {
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

export function isInternalSkill(frontmatter) {
  const metadata = frontmatter.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }

  return metadata.internal === true || metadata.internal === "true";
}

/**
 * Parse and validate the comma-separated `category` frontmatter field.
 * Returns `{ categories, errors }` where categories is sorted unique when valid.
 */
export function parseCategories(frontmatter) {
  const errors = [];
  const { category } = frontmatter;

  if (category === undefined || category === null || category === "") {
    errors.push("missing required frontmatter field: category");
    return { categories: [], errors };
  }

  if (typeof category !== "string") {
    errors.push(`category must be a string (got ${typeof category})`);
    return { categories: [], errors };
  }

  const raw = category.trim();
  if (raw.length === 0) {
    errors.push("category must be a non-empty string");
    return { categories: [], errors };
  }

  const parts = raw.split(",").map((part) => part.trim());
  const seen = new Set();
  const categories = [];

  for (const part of parts) {
    if (part.length === 0) {
      errors.push(
        "category must be a comma-separated list of non-empty values",
      );
      continue;
    }

    if (!CATEGORY_PATTERN.test(part)) {
      errors.push(
        `category "${part}" must be lowercase letters with single hyphens only (no digits, no leading/trailing/consecutive hyphens)`,
      );
      continue;
    }

    if (seen.has(part)) {
      errors.push(`duplicate category "${part}"`);
      continue;
    }

    seen.add(part);
    categories.push(part);
  }

  categories.sort((a, b) => a.localeCompare(b, "en"));
  return { categories, errors };
}

export function validateSkill(filePath, frontmatter) {
  const errors = [];
  const skillDir = path.dirname(filePath);
  const folderName = path.basename(skillDir);

  if (isInternalSkill(frontmatter)) {
    errors.push(
      "remove metadata.internal from installable skills under skills/ (template-only marker)",
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

  const { errors: categoryErrors } = parseCategories(frontmatter);
  errors.push(...categoryErrors);

  return errors;
}

export function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}
