# Filesystem MCP Server Setup

Use this guide to set up `@modelcontextprotocol/server-filesystem` for the ask-question skill.

## Purpose

The filesystem MCP server lets the agent search and read project documentation in a controlled way.

## Steps

1. Open the MCP configuration file for your agent host.
2. Add a server entry for the filesystem package.
3. Set the allowed directory to your project root.
4. Restart the agent host or reload MCP servers.
5. Confirm that the `list_allowed_directories` tool is available.

## NPX example

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "${workspaceFolder}"
      ]
    }
  }
}
```

If `${workspaceFolder}` is not supported, use the absolute path to your project root.

## Host differences

Some hosts use a different top-level key (for example `servers` instead of `mcpServers`).

Keep these values the same in every host:

- Package name: `@modelcontextprotocol/server-filesystem`
- At least one allowed directory that includes your project

## After setup

Run the ask-question skill again. The skill must use the filesystem MCP server when it is available.
