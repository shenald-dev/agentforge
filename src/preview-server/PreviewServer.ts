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
            const composeProcess = spawn("docker-compose", ["up", "--build"], {
                cwd: composePath,
                stdio: "pipe", // Capture output to avoid overwhelming the console, but still monitor
            });

            composeProcess.stdout.on("data", (data) => {
                const out = data.toString();
                // Simple health heuristic: waiting for the backend or frontend to bind
                if (out.includes("Application startup complete") || out.includes("ready started server on")) {
                    spinner.succeed(chalk.green("✨ Preview environment is live!"));
                    console.log(chalk.yellow("   Frontend: http://localhost:3000"));
                    console.log(chalk.yellow("   Backend API: http://localhost:8000"));
                    resolve();
                }
            });

            composeProcess.stderr.on("data", (data) => {
                // Some build steps write to stderr naturally, so we just log it dynamically if debugging
            });

            composeProcess.on("close", (code) => {
                if (code !== 0) {
                    spinner.fail(chalk.red(`Docker compose exited with code ${code}`));
                    reject(new Error(`Docker compose failed`));
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
