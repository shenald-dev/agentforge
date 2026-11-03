import * as net from "net";
import { exec } from "child_process";
import { promisify } from "util";
import pc from "picocolors";
import { ConfigManager } from "../utils/config";

const execAsync = promisify(exec);

interface DiagnosticItem {
  id: string;
  name: string;
  status: "ok" | "warn" | "fail";
  message: string;
  recommendation?: string;
}

interface DiagnosticReport {
  timestamp: string;
  items: DiagnosticItem[];
  allHealthy: boolean;
  composeCommand: {
    command: string;
    argsPrefix: string[];
    version: string | null;
  } | null;
}

/**
 * System diagnostic doctor that checks runtime health, tool installations,
 * daemon statuses, and port bindings.
 */
export class SystemDoctor {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * Runs complete system diagnostics.
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    const items: DiagnosticItem[] = [];

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

  private checkNodeVersion(): DiagnosticItem {
    const currentVersion = process.version; // e.g. "v20.10.0"
    const major = parseInt(currentVersion.replace(/^v/, "").split(".")[0], 10);

    if (major >= 18) {
      return {
        id: "node",
        name: "Node.js Environment",
        status: "ok",
        message: `Node.js ${currentVersion} (v18+ requirement met)`,
      };
    } else {
      return {
        id: "node",
        name: "Node.js Environment",
        status: "fail",
        message: `Node.js ${currentVersion} is older than the required v18.0.0`,
        recommendation: "Please update Node.js to v18 or later (https://nodejs.org).",
      };
    }
  }

  private async checkGit(): Promise<DiagnosticItem> {
    try {
      const { stdout } = await execAsync("git --version");
      return {
        id: "git",
        name: "Git CLI",
        status: "ok",
        message: stdout.trim(),
      };
    } catch {
      return {
        id: "git",
        name: "Git CLI",
        status: "warn",
        message: "Git is not installed or not in PATH",
        recommendation: "Install Git from https://git-scm.com/downloads for repository initialization.",
      };
    }
  }

  private async checkDocker(): Promise<{ dockerItem: DiagnosticItem; isAvailable: boolean }> {
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
      } catch {
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
    } catch {
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
  async checkDockerCompose(): Promise<{
    composeItem: DiagnosticItem;
    composeCommand: { command: string; argsPrefix: string[]; version: string | null } | null;
  }> {
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
    } catch {
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
      } catch {
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

  private async checkOpenRouterKey(): Promise<DiagnosticItem> {
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
  checkPortAvailable(port: number, description: string): Promise<DiagnosticItem> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          resolve({
            id: `port-${port}`,
            name: `Port ${port} (${description})`,
            status: "warn",
            message: `Port ${port} is currently in use by another process`,
            recommendation: `Stop the service occupying port ${port} or update docker-compose.yml port mapping.`,
          });
        } else {
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
  formatReport(report: DiagnosticReport): string {
    const lines: string[] = [];
    lines.push(pc.bold(pc.cyan("\n🩺 AgentForge System Diagnostics Report")));
    lines.push(pc.gray(`Timestamp: ${report.timestamp}\n`));

    for (const item of report.items) {
      let icon = pc.green("✔");
      let statusText = pc.green("PASSED");
      if (item.status === "warn") {
        icon = pc.yellow("⚠");
        statusText = pc.yellow("NOTICE");
      } else if (item.status === "fail") {
        icon = pc.red("✖");
        statusText = pc.red("FAILED");
      }

      lines.push(`  ${icon} ${pc.bold(item.name)}: ${item.message} [${statusText}]`);
      if (item.recommendation) {
        lines.push(`     ${pc.dim("↳ Suggestion:")} ${pc.italic(item.recommendation)}`);
      }
    }

    lines.push("");
    if (report.allHealthy) {
      lines.push(pc.bold(pc.green("✨ System is fully configured and ready to forge applications!")));
    } else {
      lines.push(pc.bold(pc.yellow("⚠️ System has some configuration notices. Review suggestions above.")));
    }
    lines.push("");

    return lines.join("\n");
  }
}
