## 2024-05-14 — Directory Copy Optimization

Learning:
`fs.readdir` iterations using standard `for` loops create sequential I/O delays during scaffolding operations, slowing down generation tasks, particularly with deep file hierarchies.

Action:
Replaced standard loops over file entries with `Promise.all` + `map` for concurrent file reads, parses, and writes to dramatically improve template copying speeds.

## 2024-05-15 — Unconsumed Stream Buffer Overflow

Learning:
Using `stdio: "pipe"` when spawning a child process without actively consuming or draining the `stdout`/`stderr` streams can cause the process to hang indefinitely once the OS pipe buffer fills up.

Action:
Use `stdio: "ignore"` or actively drain the stream (`stream.resume()`) for child processes where output isn't needed.
