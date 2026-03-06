# Contributing to AgentForge 🚀

First off, thank you for considering contributing to AgentForge! It's people like you that make this tool great.

## 🛠️ Development Setup

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Make your changes in the `src` or `templates` directories.
4. Run tests to ensure everything is solid: `npm test`
5. Build the CLI: `npm run build`

## ✨ Adding a New Template

Templates live in the `/templates` directory. To add a new one:
1. Create a new directory (e.g., `templates/my-awesome-stack`).
2. Add your boilerplate code.
3. Append `.hbs` to files that need Handlebars variable injection (like `package.json.hbs`, `README.md.hbs`).
4. Test it out locally with `node dist/cli/index.js create`!

## 🐛 Submitting Bugs
Please use the GitHub Issue Tracker. Include your OS, Node version, and steps to reproduce.

*Keep the vibe flowing.*
