#!/usr/bin/env node
/**
 * Create a default .memory/settings.yml in the current working directory.
 * Does not overwrite an existing configuration file.
 */

import {
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_RELATIVE = join(".memory", "settings.yml");
const workspaceRoot = process.cwd();
const configPath = join(workspaceRoot, CONFIG_RELATIVE);
const memoryDir = join(workspaceRoot, ".memory");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultTemplate = join(
  scriptDir,
  "..",
  "assets",
  "settings.default.yml",
);

if (!existsSync(defaultTemplate)) {
  console.error(`Default template not found: ${defaultTemplate}`);
  process.exit(1);
}

try {
  if (existsSync(memoryDir)) {
    if (!statSync(memoryDir).isDirectory()) {
      console.error(
        `.memory exists but is not a directory: ${memoryDir}`,
      );
      process.exit(1);
    }
  } else {
    mkdirSync(memoryDir, { recursive: true });
  }
} catch (error) {
  console.error(
    `Could not create or access .memory directory: ${memoryDir}`,
  );
  console.error(error.message ?? error);
  process.exit(1);
}

try {
  copyFileSync(defaultTemplate, configPath, constants.COPYFILE_EXCL);
  console.log(`Created configuration file: ${configPath}`);
} catch (error) {
  if (error && error.code === "EEXIST") {
    console.log(`Configuration file already exists: ${configPath}`);
    process.exit(0);
  }
  throw error;
}
