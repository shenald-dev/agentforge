# FORGE Journal

## 2026-06-07 — Improvement Run

**Improvement:** [bug_fix] Fix Windows docker-compose command to use .exe extension
**Impact:** Medium — Fixes a latent cross-platform bug that would cause test failures on Windows and prevent the preview command from working on Windows. Aligns code with existing test expectations.
**Files Modified:** src/preview-server/PreviewServer.ts
**Verification:** Tests=PASS, Build=PASS, Lint=PASS
**Shipped:** True

**AI Summary:** Fix a latent cross-platform bug where PreviewServer fails to spawn docker-compose on Windows because it doesn't use the .exe extension. The test already expects this behavior, and the codebase already uses this pattern for npm. This is a simple one-line fix that improves cross-platform compatibility and aligns the code with test expectations.
