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
exports.SystemDoctor = void 0;
const net = __importStar(require("net"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const picocolors_1 = __importDefault(require("picocolors"));
const config_1 = require("../utils/config");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * System diagnostic doctor that checks runtime health, tool installations,
 * daemon statuses, and port bindings.
 */
class SystemDoctor {
    configManager;
    constructor() {
        this.configManager = new config_1.ConfigManager();
    }
    /**
     * Runs complete system diagnostics.
     */
    async runDiagnostics() {
        const items = [];
        // 1. Check Node.js version
        items.push(this.checkNodeVersion());
        // 2. Check Git installation
        items.push(await this.checkGit());
        // 3. Check Docker and Docker Compose
        const dockerResult = await this.checkDocker();
        items.push(dockerResult.dockerItem);
        const composeResult = await this.checkDockerCompose();
        items.push(composeResult.composeItem);
        // 4. Check OpenRouter Configuration
        items.push(await this.checkOpenRouterKey());
        // 5. Check Default Ports (3000 for frontend, 8000 for backend)
        items.push(await this.checkPortAvailable(3000, "Frontend default port"));
        items.push(await this.checkPortAvailable(8000, "Backend default port"));
        const hasFailure = items.some((i) => i.status === "fail");
        return {
            timestamp: new Date().toISOString(),
            items,
            allHealthy: !hasFailure,
            composeCommand: composeResult.composeCommand,
        };
    }
    checkNodeVersion() {
        const currentVersion = process.version; // e.g. "v20.10.0"
        const major = parseInt(currentVersion.replace(/^v/, "").split(".")[0], 10);
        if (major >= 18) {
            return {
                id: "node",
                name: "Node.js Environment",
                status: "ok",
                message: `Node.js ${currentVersion} (v18+ requirement met)`,
            };
        }
        else {
            return {
                id: "node",
                name: "Node.js Environment",
                status: "fail",
                message: `Node.js ${currentVersion} is older than the required v18.0.0`,
                recommendation: "Please update Node.js to v18 or later (https://nodejs.org).",
            };
        }
    }
    async checkGit() {
        try {
            const { stdout } = await execAsync("git --version");
            return {
                id: "git",
                name: "Git CLI",
                status: "ok",
                message: stdout.trim(),
            };
        }
        catch {
            return {
                id: "git",
                name: "Git CLI",
                status: "warn",
                message: "Git is not installed or not in PATH",
                recommendation: "Install Git from https://git-scm.com/downloads for repository initialization.",
            };
        }
    }
    async checkDocker() {
        try {
            const { stdout: versionOut } = await execAsync("docker --version");
            // Now check if daemon is running
            try {
                await execAsync("docker info", { timeout: 4000 });
                return {
                    dockerItem: {
                        id: "docker",
                        name: "Docker Engine",
                        status: "ok",
                        message: `${versionOut.trim()} (Daemon active)`,
                    },
                    isAvailable: true,
                };
            }
            catch {
                return {
                    dockerItem: {
                        id: "docker",
                        name: "Docker Engine",
                        status: "warn",
                        message: `${versionOut.trim()} installed, but Docker daemon is not running`,
                        recommendation: "Start Docker Desktop or your Docker system service to use 'agentforge preview'.",
                    },
                    isAvailable: false,
                };
            }
        }
        catch {
            return {
                dockerItem: {
                    id: "docker",
                    name: "Docker Engine",
                    status: "warn",
                    message: "Docker is not installed or not in PATH",
                    recommendation: "Install Docker Desktop from https://www.docker.com to enable containerized local preview.",
                },
                isAvailable: false,
            };
        }
    }
    /**
     * Detects whether modern Docker Compose v2 plugin (`docker compose`) or
     * legacy standalone (`docker-compose`) is available.
     */
    async checkDockerCompose() {
        // 1. Try modern docker compose plugin first
        try {
            const { stdout } = await execAsync("docker compose version");
            return {
                composeItem: {
                    id: "docker-compose",
                    name: "Docker Compose",
                    status: "ok",
                    message: `${stdout.trim()} (Plugin v2)`,
                },
                composeCommand: {
                    command: "docker",
                    argsPrefix: ["compose"],
                    version: stdout.trim(),
                },
            };
        }
        catch {
            // 2. Try standalone docker-compose
            try {
                const { stdout } = await execAsync("docker-compose --version");
                return {
                    composeItem: {
                        id: "docker-compose",
                        name: "Docker Compose",
                        status: "ok",
                        message: `${stdout.trim()} (Standalone)`,
                    },
                    composeCommand: {
                        command: "docker-compose",
                        argsPrefix: [],
                        version: stdout.trim(),
                    },
                };
            }
            catch {
                return {
                    composeItem: {
                        id: "docker-compose",
                        name: "Docker Compose",
                        status: "warn",
                        message: "Neither 'docker compose' nor 'docker-compose' was found",
                        recommendation: "Enable the Compose plugin in Docker Desktop or install docker-compose.",
                    },
                    composeCommand: null,
                };
            }
        }
    }
    async checkOpenRouterKey() {
        const key = await this.configManager.getApiKey();
        if (key && key.trim()) {
            const masked = key.length > 8 ? `${key.slice(0, 6)}...${key.slice(-4)}` : "***";
            return {
                id: "openrouter",
                name: "OpenRouter LLM Integration",
                status: "ok",
                message: `Configured (${masked})`,
            };
        }
        return {
            id: "openrouter",
            name: "OpenRouter LLM Integration",
            status: "warn",
            message: "No API key configured (LLM README/Architecture refinement will be skipped)",
            recommendation: "Run 'agentforge auth' to set your free OpenRouter API key for autonomous AI generation.",
        };
    }
    /**
     * Checks if a local port is free or currently bound by another service.
     */
    checkPortAvailable(port, description) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once("error", (err) => {
                if (err.code === "EADDRINUSE") {
                    resolve({
                        id: `port-${port}`,
                        name: `Port ${port} (${description})`,
                        status: "warn",
                        message: `Port ${port} is currently in use by another process`,
                        recommendation: `Stop the service occupying port ${port} or update docker-compose.yml port mapping.`,
                    });
                }
                else {
                    resolve({
                        id: `port-${port}`,
                        name: `Port ${port} (${description})`,
                        status: "warn",
                        message: `Could not verify port ${port}: ${err.message}`,
                    });
                }
            });
            server.once("listening", () => {
                server.close(() => {
                    resolve({
                        id: `port-${port}`,
                        name: `Port ${port} (${description})`,
                        status: "ok",
                        message: `Available`,
                    });
                });
            });
            server.listen(port, "127.0.0.1");
        });
    }
    /**
     * Formats diagnostic report into a beautiful colored terminal view.
     */
    formatReport(report) {
        const lines = [];
        lines.push(picocolors_1.default.bold(picocolors_1.default.cyan("\n🩺 AgentForge System Diagnostics Report")));
        lines.push(picocolors_1.default.gray(`Timestamp: ${report.timestamp}\n`));
        for (const item of report.items) {
            let icon = picocolors_1.default.green("✔");
            let statusText = picocolors_1.default.green("PASSED");
            if (item.status === "warn") {
                icon = picocolors_1.default.yellow("⚠");
                statusText = picocolors_1.default.yellow("NOTICE");
            }
            else if (item.status === "fail") {
                icon = picocolors_1.default.red("✖");
                statusText = picocolors_1.default.red("FAILED");
            }
            lines.push(`  ${icon} ${picocolors_1.default.bold(item.name)}: ${item.message} [${statusText}]`);
            if (item.recommendation) {
                lines.push(`     ${picocolors_1.default.dim("↳ Suggestion:")} ${picocolors_1.default.italic(item.recommendation)}`);
            }
        }
        lines.push("");
        if (report.allHealthy) {
            lines.push(picocolors_1.default.bold(picocolors_1.default.green("✨ System is fully configured and ready to forge applications!")));
        }
        else {
            lines.push(picocolors_1.default.bold(picocolors_1.default.yellow("⚠️ System has some configuration notices. Review suggestions above.")));
        }
        lines.push("");
        return lines.join("\n");
    }
}
exports.SystemDoctor = SystemDoctor;
