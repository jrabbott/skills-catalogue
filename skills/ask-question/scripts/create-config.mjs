#!/usr/bin/env node
/**
 * Create a default .ask-question.yaml in the current working directory.
 * Does not overwrite an existing configuration file.
 */

import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_NAME = ".ask-question.yaml";
const workspaceRoot = process.cwd();
const configPath = join(workspaceRoot, CONFIG_NAME);

if (existsSync(configPath)) {
  console.log(`Configuration file already exists: ${configPath}`);
  process.exit(0);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultTemplate = join(
  scriptDir,
  "..",
  "assets",
  "ask-question.default.yaml",
);

if (!existsSync(defaultTemplate)) {
  console.error(`Default template not found: ${defaultTemplate}`);
  process.exit(1);
}

copyFileSync(defaultTemplate, configPath);
console.log(`Created configuration file: ${configPath}`);
