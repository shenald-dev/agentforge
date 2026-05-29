We are given a merge conflict in CHANGELOG.md between base (master) and head (perf/cache-handlebars-import-999252633380125373).
 The ancestor is the common base.

 We are to perform a 3-way merge and output the resolved file.

 Steps:
 1. We have the ancestor, base, and head versions (though truncated in the description, we have the diffs and the changes described).
 2. The conflict is at the top of the file (lines 1-70 in base and 1-74 in head) because the diff shows changes at the very beginning.

 From the context:

 Base (master) changes (from ancestor):
   - Changed the version header from [2.0.19] to [2.0.20] and updated the changelog entry for 2.0.20.
   - Then it also added a new section for [2.0.19] (which was already present in the ancestor? but note: the ancestor had [2.0.19] at the top) and then reordered some sections.

 However, note the provided base version (truncated) starts with:
   ## [2.0.20] - 2026-05-26
   * [Lifecycle]: ... 
   * [Dependencies]: ...

   ## [2.0.19] - 2026-05-19
   * ... 

 Head (perf/cache-handlebars-import-...) changes:
   - Changed the version header from [2.0.19] to [2.0.21] and added a new entry for 2.0.21 (with performance improvement).
   - Then it also added a new section for [2.0.20] (which is the same as the base's [2.0.20] but note: the base already had [2.0.20] as the top) and then the rest.

 The Git Diff (Head changes vs base) shows:
   @@ -1,3 +1,12 @@
   +## [2.0.21] - 2026-05-28
   +
   +* **[Performance]:** Caches the dynamic import of the `handlebars` module in `ProjectGenerator.ts` across multiple file processing invocations. This prevents redundant Promise allocations and module resolution overhead when scaffolding templates concurrently, significantly improving cold start render efficiency.
   +
   +## [2.0.20] - 2026-05-26
   +
   +* **[Lifecycle]:** Assessed codebase and verified structural soundness after previous handlebars dynamic import optimization. No dead code found to prune.
   +* **[Dependencies]:** Safely bumped minor/patch versions for `@langchain/core` (1.1.47 -> 1.1.48) and `@langchain/openai` (1.4.6 -> 1.4.7).
   +
    ## [2.0.19] - 2026-05-19
   
    * **[Lifecycle]:** Assured codebase stability and execution of tests. No dead code found to prune.

 This diff indicates that the head branch has added two new version sections at the top: [2.0.21] and [2.0.20] (with the same content as the base's [2.0.20] section) and then the base's [2.0.19] section follows.

 However, note that the base branch already had [2.0.20] as the top. So the conflict is that:

   - The base branch changed the top from [2.0.19] (in ancestor) to [2.0.20] and then kept [2.0.19] below.
   - The head branch changed the top from [2.0.19] (in ancestor) to [2.0.21] and then added [2.0.20] (which is the same as the base's [2.0.20]) and then the [2.0.19] section.

 Therefore, to resolve:

   We want to keep:
     - The head's new [2.0.21] section (because it's a new feature in the PR)
     - The base's [2.0.20] section (which is also present in the head's added section, so we can take one copy)
     - Then the [2.0.19] section and the rest of the changelog.

 But note: the base branch also made changes to the [2.0.19] section and below? Actually, looking at the context:

   Base (master) changes (from the "What Changed" section for base):
        - ## [2.0.19] - 2026-05-19
          + ## [2.0.20] - 2026-05-26
            
          - * **[Lifecycle]:** Assured codebase stability and execution of tests. No dead code found to prune.
          + * **[Lifecycle]:** Assessed codebase and verified structural soundness after previous handlebars dynamic import optimization. No dead code found to prune.
          + * **[Dependencies]:** Safely bumped minor/patch versions for `@langchain/core` (1.1.47 -> 1.1.48) and `@langchain/openai` (1.4.6 -> 1.4.7).
          
          - 
          + ## [2.0.19] - 2026-05-19
          - ## [2.0.18] - 2026-05-06
          + 
          - 
          + * **[Lifecycle]:** Assured codebase stability and execution of tests. No dead code found to prune.
          - * **[Lifecycle]:** Assured codebase stability and execution of newly added tests.
          + * **[Dependencies]:** Safely bumped minor/patch versions for dependencies.
          
          - * **[Dependencies]:** Safely bumped `@langchain/core` to 1.1.45 and `@types/node` to 20.19.40.
          + 
          - 
          + ## [2.0.18] - 2026-05-06
            
          - ## [2.0.1] - 2026-03-29
          + * **[Lifecycle]:** Assured codebase stability and execution of newly added tests.
          - * **Lifecycle:** Pruned dead code (`LLMUtils`) and its corresponding unit tests.
          + 
          - * **Fix:** Added missing `.eslintrc.js` to restore linting step.
          + * **[Dependencies]:** Safely bumped `@langchain/core` to 1.1.45 and `@types/node` to 20.19.40.
          - * **Docs:** Updated `warden.md` ledger.
          + 
            
          - ## [2.0.2] - 2026-04-07
          + ## [2.0.1] - 2026-03-29
          - * **Optimization/QA:** Verified recent CLI optimization for lazy-loading dependencies. No dead code found to prune.
          + * **Lifecycle:** Pruned dead code (`LLMUtils`) and its corresponding unit tests.
          - 
          + * **Fix:** Added missing `.eslintrc.js` to restore linting step.
          - ## [2.0.3] - 2026-04-09
          + * **Docs:** Updated `warden.md` ledger.
          - * **Lifecycle:** Fixed TypeScript compilation errors (`TS7006`, `TS2322`) related to `@clack/prompts` introduced during refactoring of dynamic imports