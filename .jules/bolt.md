## 2026-05-26 — Optimize dynamic module imports in loops

Learning:
Dynamically importing a module inside a recursive function (e.g., loading Handlebars per template file) repeatedly triggers Node.js module resolution, introducing unnecessary latency.

Action:
Cache the resolved module instance at the class level when it needs to be dynamically loaded in loops or recursive operations (e.g., `this.handlebarsModule = (await import('handlebars')).default`).