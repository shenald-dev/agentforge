
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

## [2.0.10] - 2026-04-27
* **[Lifecycle]:** Assured codebase stability. Safely updated `@langchain/core` to `1.1.42` and `@langchain/openai` to `1.4.5`. No dead code found.

## [2.0.11] - 2026-04-28
* **[Lifecycle]:** Assessed codebase and verified structural soundness after previous additions (path traversal security tests in `ProjectGenerator.test.ts`). No dead code found to prune.
* **[Fix]:** Ensured tests are complete and build is stable.
* **[Docs]:** Updated `CHANGELOG.md` and `.jules/warden.md` ledger.

* **[Dependencies]:** Bumped @clack/prompts from 1.2.0 to 1.3.0.

## [2.0.14] - 2026-05-01
* **[Lifecycle]:** Assessed codebase and verified structural soundness after previous path resolution optimization. No dead code found to prune.
* **[Dependencies]:** Deferred major upgrades.


## [2.0.16] - 2026-05-03
* **[Performance]:** Optimized generated path validation checks and Docker compose stdout parsing heuristics.
* **[Lifecycle]:** Bumped `@langchain/core` to `1.1.44` for security and stability.
* **Lifecycle:** Assured repository stability, verified test execution, and confirmed no dead code or safe dependency updates were required.
