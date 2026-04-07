import { spawn } from "child_process";
import * as path from "path";
import pc from "picocolors";

export class PreviewServer {

    /**
     * Spawns a docker-compose process in the target generated directory.
     */
    async start(projectPath: string): Promise<void> {
        const { default: ora } = await import("ora");

        const composePath = path.resolve(projectPath);
        console.log(pc.cyan(`\n🚀 Initializing Preview Server at ${composePath}`));

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
                    spinner.succeed(pc.green("✨ Preview environment is live!"));
                    console.log(pc.yellow("   Frontend: http://localhost:3000"));
                    console.log(pc.yellow("   Backend API: http://localhost:8000"));
                    resolve();
                }
            });

            // Actively drain stderr without the overhead of an empty callback
            composeProcess.stderr.resume();

            composeProcess.on("error", (err) => {
                spinner.fail(pc.red(`Failed to start preview server: ${err.message}`));
                reject(err);
            });

            composeProcess.on("close", (code) => {
                if (code !== 0) {
                    spinner.fail(pc.red(`Docker compose exited with code ${code}`));
                    reject(new Error(`Docker compose failed`));
                }
            });

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log(pc.magenta("\nGracefully shutting down preview containers..."));
                spawn("docker-compose", ["down"], { cwd: composePath, stdio: "inherit" }).on('close', () => {
                    process.exit(0);
                });
            });
        });
    }
}
