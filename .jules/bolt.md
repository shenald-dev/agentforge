## 2024-03-26 — Fix TypeScript Build Outputs

Learning:
The repository's `tsconfig.json` was improperly configured with `"rootDir": "./"`. This caused `tsc` to replicate the `src/` directory structure inside `dist/`, resulting in `dist/src/cli/index.js`. The package configuration (`package.json`) expected the entrypoint to be `dist/cli/index.js`, breaking the compiled CLI entirely.

Action:
Always configure `"rootDir": "./src"` and `"include": ["src/**/*"]` when all source code is housed within a `src` directory, to ensure compiled assets map cleanly into the `dist` directory.
