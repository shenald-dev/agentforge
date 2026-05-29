## 2026-05-26 — Optimize dynamic module imports in loops

Learning:
Dynamically importing a module inside a recursive function (e.g., loading Handlebars per template file) repeatedly triggers Node.js module resolution, introducing unnecessary latency.

Action:
<<<<<<< HEAD
Cache the resolved module instance at the class level when it needs to be dynamically loaded in loops or recursive operations (e.g., `this.handlebarsModule = (await import('handlebars')).default`).
=======
Cache the resolved module instance at the class level when it needs to be dynamically loaded in loops or recursive operations (e.g., `this.handlebarsModule = (await import('handlebars')).default`).

## 2024-05-27 — Optimized concurrent dynamic imports

Learning:
When dynamically loading dependencies inside a concurrent `Promise.all` operation (like a recursive directory map), caching the resolved module object is too slow. The first few concurrent iterations bypass the initial null-check and trigger redundant, expensive import requests simultaneously.

Action:
Cache the Promise of the dynamic import instead of the resolved module so concurrent iterations await the exact same resolution task.

## 2026-05-28 — Group sequential dynamic imports

Learning:
Sequential dynamic imports (e.g., `await import(...)` followed by another `await import(...)`) cause a waterfall effect, degrading cold start performance of CLI commands.

Action:
Group multiple dynamic imports together using `await Promise.all(...)` to execute module resolution and loading concurrently, minimizing overall execution time.
>>>>>>> origin/master
