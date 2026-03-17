## 2024-05-14 — Directory Copy Optimization

Learning:
`fs.readdir` iterations using standard `for` loops create sequential I/O delays during scaffolding operations, slowing down generation tasks, particularly with deep file hierarchies.

Action:
Replaced standard loops over file entries with `Promise.all` + `map` for concurrent file reads, parses, and writes to dramatically improve template copying speeds.
