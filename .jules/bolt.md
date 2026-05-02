## 2024-03-26 — Fix TypeScript Build Outputs

        Learning:
        The repository's `tsconfig.json` was improperly configured with `"rootDir": "./"`. This caused `tsc` to replicate the `src/` directory structure inside `dist/`, resulting in `dist/src/cli/index.js`. The package configuration (`package.json`) expected the entrypoint to be `dist/cli/index.js`, breaking the compiled CLI entirely.

        Action:
        Always configure `"rootDir": "./src"` and `"include": ["src/**/*"]` when all source code is housed within a `src` directory,

        // ... 8373.8 characters truncated (middle section) ...

        h Resolution Optimization in Generator

        Learning:
        Inside `ProjectGenerator.ts`, `path.resolve` was being called redundantly for every single file and subdirectory during the recursive template scaffolding. This caused excessive CPU overhead as templates scaled up in file count.

        Action:
        Pre-resolve the destination path (`normalizedDestDir`) once per recursive iteration, rather than inside the concurrent map loop. This speeds up scaffolding and is measurable by tracking project generation time for large templates.