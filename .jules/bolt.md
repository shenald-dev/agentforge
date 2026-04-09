## 2024-03-26 — Dynamic Imports and TypeScript Compilation Insights

Learning:
In a TypeScript project, replacing top-level imports with dynamic imports (`await import(...)`) for performance must be accompanied by `import type { ModuleName }` to maintain strict typing for class properties without triggering eager evaluation. Additionally, in this project's configuration, changing `rootDir` to `"./src"` in `tsconfig.json` breaks the `npm run build` command because the test files fall outside this directory and trigger TS6059 errors.

Action:
When lazy-loading heavy dependencies, use `import type` to safely preserve TypeScript bindings. Avoid altering the `rootDir` in `tsconfig.json` to exclude the `tests/` directory unless explicitly requested, as `tsc` relies on it being `"./"` to validate the entire project structure properly. Always carefully revert unintended modifications to `node_modules` and `package-lock.json` caused by local test commands before committing.
