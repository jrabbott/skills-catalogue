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
 * Parse a frontmatter field that is a single string or a YAML list of strings.
 * Returns `{ values, errors }` (values unsorted; duplicates reported as errors).
 */
export function parseStringOrList(value, fieldName) {
  const errors = [];

  if (value === undefined || value === null || value === "") {
    return { values: [], errors };
  }

  /** @type {unknown[]} */
  let rawItems;
  if (typeof value === "string") {
    rawItems = [value];
  } else if (Array.isArray(value)) {
    rawItems = value;
  } else {
    errors.push(
      `${fieldName} must be a string or a list of strings (got ${typeof value})`,
    );
    return { values: [], errors };
  }

  const seen = new Set();
  const values = [];

  for (const item of rawItems) {
    if (typeof item !== "string") {
      errors.push(
        `${fieldName} entries must be strings (got ${typeof item})`,
      );
      continue;
    }

    const trimmed = item.trim();
    if (trimmed.length === 0) {
      errors.push(`${fieldName} must not contain empty values`);
      continue;
    }

    if (seen.has(trimmed)) {
      errors.push(`duplicate ${fieldName} entry "${trimmed}"`);
      continue;
    }

    seen.add(trimmed);
    values.push(trimmed);
  }

  return { values, errors };
}

/**
 * Parse and validate the `category` frontmatter field (string or list).
 * Returns `{ categories, errors }` where categories is sorted unique when valid.
 */
export function parseCategories(frontmatter) {
  const { category } = frontmatter;

  if (category === undefined || category === null || category === "") {
    return {
      categories: [],
      errors: ["missing required frontmatter field: category"],
    };
  }

  const { values, errors } = parseStringOrList(category, "category");
  if (errors.length) {
    return { categories: [], errors };
  }

  if (values.length === 0) {
    return {
      categories: [],
      errors: ["category must include at least one label"],
    };
  }

  const categories = [];
  for (const part of values) {
    if (!CATEGORY_PATTERN.test(part)) {
      errors.push(
        `category "${part}" must be lowercase letters with single hyphens only (no digits, no leading/trailing/consecutive hyphens)`,
      );
      continue;
    }
    categories.push(part);
  }

  if (errors.length) {
    return { categories: [], errors };
  }

  categories.sort((a, b) => a.localeCompare(b, "en"));
  return { categories, errors };
}

/**
 * Parse and validate the optional `dependency` frontmatter field (string or list).
 * Returns `{ dependencies, errors }` where dependencies is sorted unique when valid.
 */
export function parseDependencies(frontmatter) {
  const { dependency } = frontmatter;

  if (dependency === undefined || dependency === null || dependency === "") {
    return { dependencies: [], errors: [] };
  }

  const { values, errors } = parseStringOrList(dependency, "dependency");
  if (errors.length) {
    return { dependencies: [], errors };
  }

  const dependencies = [];
  for (const part of values) {
    if (!NAME_PATTERN.test(part)) {
      errors.push(
        `dependency "${part}" must be lowercase alphanumeric with single hyphens (no leading/trailing/consecutive hyphens)`,
      );
      continue;
    }
    dependencies.push(part);
  }

  if (errors.length) {
    return { dependencies: [], errors };
  }

  dependencies.sort((a, b) => a.localeCompare(b, "en"));
  return { dependencies, errors };
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

  const { errors: dependencyErrors } = parseDependencies(frontmatter);
  errors.push(...dependencyErrors);

  return errors;
}

/**
 * Validate that every dependency names an existing skill and that the graph has no cycles.
 * `skills` is an array of `{ name, dependencies }` (dependencies already parsed).
 * Returns a list of error strings.
 */
export function validateDependencyGraph(skills) {
  const errors = [];
  const byName = new Map();

  for (const skill of skills) {
    byName.set(skill.name, skill);
  }

  for (const skill of skills) {
    for (const dep of skill.dependencies) {
      if (!byName.has(dep)) {
        errors.push(
          `skill "${skill.name}" dependency "${dep}" does not match an installable skill`,
        );
      }
      if (dep === skill.name) {
        errors.push(`skill "${skill.name}" must not depend on itself`);
      }
    }
  }

  /** @type {Map<string, "visiting" | "visited">} */
  const state = new Map();

  function visit(name, stack) {
    const current = state.get(name);
    if (current === "visited") {
      return;
    }
    if (current === "visiting") {
      const cycleStart = stack.indexOf(name);
      const cycle =
        cycleStart >= 0
          ? [...stack.slice(cycleStart), name].join(" -> ")
          : [...stack, name].join(" -> ");
      errors.push(`dependency cycle detected: ${cycle}`);
      return;
    }

    state.set(name, "visiting");
    const skill = byName.get(name);
    if (skill) {
      for (const dep of skill.dependencies) {
        if (byName.has(dep)) {
          visit(dep, [...stack, name]);
        }
      }
    }
    state.set(name, "visited");
  }

  for (const skill of skills) {
    if (!state.has(skill.name)) {
      visit(skill.name, []);
    }
  }

  return errors;
}

/**
 * Return the transitive closure of dependency names for the given skill names.
 * `dependencyMap` maps skill name -> direct dependency name array.
 */
export function expandDependencies(skillNames, dependencyMap) {
  const result = new Set(skillNames);
  const queue = [...skillNames];

  while (queue.length > 0) {
    const name = queue.shift();
    const deps = dependencyMap.get(name) ?? [];
    for (const dep of deps) {
      if (!result.has(dep)) {
        result.add(dep);
        queue.push(dep);
      }
    }
  }

  return result;
}

export function toPosixPath(relativePath) {
  return relativePath.split(path.sep).join("/");
}
