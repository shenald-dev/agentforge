## 2024-03-26 — Fix TypeScript Build Outputs

Learning:
The repository's `tsconfig.json` was improperly configured with `"rootDir": "./"`. This caused `tsc` to replicate the `src/` directory structure inside `dist/`, resulting in `dist/src/cli/index.js`. The package configuration (`package.json`) expected the entrypoint to be `dist/cli/index.js`, breaking the compiled CLI entirely.

Action:
Always configure `"rootDir": "./src"` and `"include": ["src/**/*"]` when all source code is housed within a `src` directory, to ensure compiled assets map cleanly into the `dist` directory.

## 2024-03-29 — Fix Spawn Command Injection and Hangs

Learning:
Using `spawn` with `shell: true` and `stdio: "pipe"` without consuming the stream is a command injection risk and can cause the process to hang if the buffer fills. It also causes lint errors when unused parameters are left in event handlers.

Action:
Always use `shell: false` for `spawn`, resolve the correct executable (e.g., `npm.cmd` vs `npm`), and set `stdio: "ignore"` if the output is not needed. Ensure event handlers do not declare unused parameters, and use `const` for variables that are not reassigned.
