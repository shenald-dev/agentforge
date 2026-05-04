"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewServer = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const picocolors_1 = __importDefault(require("picocolors"));
const ora_1 = __importDefault(require("ora"));
class PreviewServer {
    /**
     * Spawns a docker-compose process in the target generated directory.
     */
    async start(projectPath) {
        const composePath = path.resolve(projectPath);
        console.log(picocolors_1.default.cyan(`\n🚀 Initializing Preview Server at ${composePath}`));
        const spinner = (0, ora_1.default)("Building and starting Docker containers...").start();
        return new Promise((resolve, reject) => {
            const composeProcess = (0, child_process_1.spawn)("docker-compose", ["up", "--build"], {
                cwd: composePath,
                stdio: "pipe", // Capture output to avoid overwhelming the console, but still monitor
            });
            let isReady = false;
            composeProcess.stdout.on("data", (data) => {
                if (isReady)
                    return;
                const out = data.toString();
                // Simple health heuristic: waiting for the backend or frontend to bind
                if (out.includes("Application startup complete") || out.includes("ready started server on")) {
                    isReady = true;
                    spinner.succeed(picocolors_1.default.green("✨ Preview environment is live!"));
                    console.log(picocolors_1.default.yellow("   Frontend: http://localhost:3000"));
                    console.log(picocolors_1.default.yellow("   Backend API: http://localhost:8000"));
                    resolve();
                }
            });
            // Actively drain stderr without the overhead of an empty callback
            composeProcess.stderr.resume();
            composeProcess.on("error", (err) => {
                spinner.fail(picocolors_1.default.red(`Failed to start preview server: ${err.message}`));
                reject(err);
            });
            composeProcess.on("close", (code) => {
                if (code !== 0) {
                    spinner.fail(picocolors_1.default.red(`Docker compose exited with code ${code}`));
                    reject(new Error(`Docker compose failed`));
                }
            });
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log(picocolors_1.default.magenta("\nGracefully shutting down preview containers..."));
                const shutdownProcess = (0, child_process_1.spawn)("docker-compose", ["down"], { cwd: composePath, stdio: "inherit" });
                shutdownProcess.on('error', (err) => {
                    console.error(picocolors_1.default.red(`\nFailed to gracefully shutdown containers: ${err instanceof Error ? err.message : String(err)}`));
                    process.exit(1);
                });
                shutdownProcess.on('close', () => {
                    process.exit(0);
                });
            });
        });
    }
}
exports.PreviewServer = PreviewServer;
