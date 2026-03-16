# Bolt's Journal

## 2024-05-28 — Initial Profiling

Learning:
Waiting for `npm install` inside the `agentforge create` command can be slow, but it's currently executed as a synchronous operation within a single file.

Action:
Improve the child process execution. The `npm install` inside `agentforge create` currently buffers all output using `stdio: "pipe"` but does not consume `stdout` or `stderr`. This can cause the process to hang if the buffer fills up. Instead of modifying the child process logic right away, let's look for other performance improvements first, or fix this hanging issue. I should consider `stdio: "ignore"` to avoid buffering output since we're using a spinner.
