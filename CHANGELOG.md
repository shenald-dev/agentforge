
## [2.0.1] - 2026-03-29
* **Lifecycle:** Pruned dead code (`LLMUtils`) and its corresponding unit tests.
* **Fix:** Added missing `.eslintrc.js` to restore linting step.
* **Docs:** Updated `warden.md` ledger.

## [2.0.2] - 2026-04-07
* **Optimization/QA:** Verified recent CLI optimization for lazy-loading dependencies. No dead code found to prune.

## [2.0.3] - 2026-04-09
* **Lifecycle:** Fixed TypeScript compilation errors (`TS7006`, `TS2322`) related to `@clack/prompts` introduced during refactoring of dynamic imports to static. Restored failing tests and verified the build pipeline.

## [2.0.4] - 2026-04-16
* **Lifecycle:** Upgraded minor/patch dependencies safely (@langchain/core, @langchain/openai, handlebars, prettier, ts-jest).
* **Optimization/QA:** Verified recent reliability improvement (AbortController timeout to LLM invoke calls) that didn't break tests.
* **Docs:** Updated `warden.md` ledger.

## [2.0.6] - 2026-04-18
* **Lifecycle:** Upgraded minor/patch dependencies safely (@langchain/core, @langchain/openai).

## [2.0.7] - 2026-04-26
* **Optimization/QA:** Verified recent CLI optimization for lazy-loading heavy UI dependencies. No dead code found to prune.
* **Lifecycle:** Upgraded minor/patch dependencies safely (@langchain/core, @langchain/openai, @types/node).
* **Docs:** Updated `warden.md` ledger.

## [2.0.8] - 2024-05-18

* **[Lifecycle]:** Assured codebase stability after previous optimizations. Pruned unused dependencies `@types/inquirer` from package manifests. Updated `@langchain/core` to `1.1.41` and `@types/node` to `20.19.39` safely.
