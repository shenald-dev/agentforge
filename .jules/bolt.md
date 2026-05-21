## 2024-05-10 — Dynamic UI Library Imports

Learning:
Static imports of heavy UI libraries like `@clack/prompts` at the root of CLI files slow down cold start performance because they are evaluated immediately upon load.

Action:
Always use localized dynamic imports (`await import()`) for heavy UI libraries inside the specific methods that require them, rather than at the root level.