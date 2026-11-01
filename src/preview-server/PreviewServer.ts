import { spawn } from "child_process";
import * as path from "path";

export interface PreviewOptions {
  composeCommand?: string;
}

export class PreviewServer {
  /**
   * Spawns a docker-compose process in the target generated directory.
   */
  async start(projectPath: string, options?: PreviewOptions): Promise<void> {
    const [{ default: ora }, { default: pc }] = await Promise.all([
      import("ora"),
      import("picocolors"),
    ]);

    const composePath = path.resolve(projectPath);
    console.log(pc.cyan(`\n🚀 Initializing Preview Server at ${composePath}`));

    const spinner = ora("Building and starting Docker containers...").start();

    return new Promise((resolve, reject) => {
      const composeCmd = options?.composeCommand || "docker-compose";
      const composeProcess = spawn(composeCmd, ["up", "--build"], {
        cwd: composePath,
        stdio: "pipe", // Capture output to avoid overwhelming the console, but still monitor
        shell: false,
      });

      let isReady = false;
      let outputBuffer = "";

      composeProcess.stdout.on("data", (data) => {
        if (isReady) return;
        outputBuffer += data.toString();
        // Simple health heuristic: waiting for the backend or frontend to bind
        if (
          outputBuffer.includes("Application startup complete") ||
          outputBuffer.includes("ready started server on")
        ) {
          isReady = true;
          spinner.succeed(pc.green("✨ Preview environment is live!"));
          console.log(pc.yellow("   Frontend: http://localhost:3000"));
          console.log(pc.yellow("   Backend API: http://localhost:8000"));
          resolve();
        }
        // Truncate buffer to prevent unbound memory growth
        if (outputBuffer.length > 5000) {
          outputBuffer = outputBuffer.slice(-5000);
        }
      });

      // Actively drain stderr without the overhead of an empty callback
      composeProcess.stderr.resume();

      let isShuttingDown = false;
      const sigintHandler = () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        process.removeListener("SIGINT", sigintHandler);

        console.log(pc.magenta("\nGracefully shutting down preview containers..."));
        const shutdownProcess = spawn(composeCmd, ["down"], {
          cwd: composePath,
          stdio: "inherit",
          shell: false,
        });

        shutdownProcess.on("error", (err) => {
          console.error(
            pc.red(
              `\nFailed to gracefully shutdown containers: ${err instanceof Error ? err.message : String(err)}`,
            ),
          );
          process.exit(1);
        });

        shutdownProcess.on("close", (code) => {
          process.exit(code || 0);
        });
      };

      process.on("SIGINT", sigintHandler);

      composeProcess.on("error", (err) => {
        process.removeListener("SIGINT", sigintHandler);
        spinner.fail(pc.red(`Failed to start preview server: ${err.message}`));
        reject(err);
      });

      composeProcess.on("close", (code) => {
        process.removeListener("SIGINT", sigintHandler);
        if (code !== 0) {
          spinner.fail(pc.red(`Docker compose exited with code ${code}`));
          reject(new Error(`Docker compose failed`));
        } else if (!isReady) {
          spinner.fail(pc.red(`Docker compose exited before server was ready`));
          reject(new Error(`Docker compose exited prematurely`));
        }
      });
    });
  }
}
