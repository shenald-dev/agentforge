
## [2.0.1] - 2026-03-29
* **Lifecycle:** Pruned dead code (`LLMUtils`) and its corresponding unit tests.
* **Fix:** Added missing `.eslintrc.js` to restore linting step.
* **Docs:** Updated `warden.md` ledger.

## [2.0.2] - 2026-04-07
* **Optimization/QA:** Verified recent CLI optimization for lazy-loading dependencies. No dead code found to prune.

## [2.0.3] - 2026-04-09
* **Lifecycle:** Fixed TypeScript compilation errors (`TS7006`, `TS2322`) related to `@clack/prompts` introduced during refactoring of dynamic imports to static. Restored failing tests and verified the build pipeline.

* **Reliability:** Added a 60-second timeout to LLM documentation generation network calls to prevent indefinite hanging on API failure.
