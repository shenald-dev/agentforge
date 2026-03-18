import { spawn } from "child_process";
import * as path from "path";
import chalk from "chalk";
import ora from "ora";

export class PreviewServer {

    /**
     * Spawns a docker-compose process in the target generated directory.
     */
    async start(projectPath: string): Promise<void> {
        const composePath = path.resolve(projectPath);
        console.log(chalk.cyan(`\n🚀 Initializing Preview Server at ${composePath}`));

        const spinner = ora("Building and starting Docker containers...").start();

        return new Promise((resolve, reject) => {
            let settled = false;
            const composeProcess = spawn("docker-compose", ["up", "--build"], {
                cwd: composePath,
                stdio: "pipe", // Capture output to avoid overwhelming the console, but still monitor
            });

            // Timeout after 120s to prevent hanging indefinitely on slow builds
            const timeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    composeProcess.kill();
                    spinner.fail(chalk.red("Docker compose timed out after 120 seconds"));
                    reject(new Error("Preview server startup timed out"));
                }
            }, 120_000);

            composeProcess.stdout.on("data", (data) => {
                const out = data.toString();
                // Simple health heuristic: waiting for the backend or frontend to bind
                if (!settled && (out.includes("Application startup complete") || out.includes("ready started server on"))) {
                    settled = true;
                    clearTimeout(timeout);
                    spinner.succeed(chalk.green("✨ Preview environment is live!"));
                    console.log(chalk.yellow("   Frontend: http://localhost:3000"));
                    console.log(chalk.yellow("   Backend API: http://localhost:8000"));
                    resolve();
                }
            });

            // Drain stderr to prevent the pipe buffer from filling up and hanging the process
            if (composeProcess.stderr) {
                composeProcess.stderr.resume();
            }

            composeProcess.on("close", (code) => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timeout);
                    if (code !== 0) {
                        spinner.fail(chalk.red(`Docker compose exited with code ${code}`));
                        reject(new Error(`Docker compose failed`));
                    }
                }
            });

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log(chalk.magenta("\nGracefully shutting down preview containers..."));
                spawn("docker-compose", ["down"], { cwd: composePath, stdio: "inherit" }).on('close', () => {
                    process.exit(0);
                });
            });
        });
    }
}
