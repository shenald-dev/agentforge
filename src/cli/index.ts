#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

let pkgVersion = "unknown";
try {
    const pkgPath = path.join(__dirname, "../../package.json");
    pkgVersion = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
} catch (error) {
    console.warn("Failed to load package version:", error);
}

program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version(pkgVersion);

// ─────────────────────────────────────
// agentforge auth
// ─────────────────────────────────────
program
    .command("auth")
    .description("Set your OpenRouter API key for LLM enchantments securely.")
    .action(async () => {
        const [[{ default: pc }, p], { ConfigManager }] = await Promise.all([
            Promise.all([import("picocolors"), import("@clack/prompts")]),
            import("../utils/config")
        ]);
        const configManager = new ConfigManager();
        
        p.intro(pc.bgCyan(pc.black(" AgentForge Configuration ")));
        
        const apiKey = await p.password({
            message: "Enter your OpenRouter API key:",
            validate: (value) => {
                if (!value) return "API key cannot be empty.";
            }
        });

        if (p.isCancel(apiKey)) {
            p.cancel("Operation cancelled.");
            process.exit(0);
        }

        const s = p.spinner();
        s.start("Saving API key securely...");
        try {
            await configManager.setConfig({ OPENROUTER_API_KEY: apiKey as string });
            s.stop(pc.green("API key saved securely to ~/.agentforge/config.json"));

            p.outro(pc.cyan("You're ready to forge!"));
        } catch (error: unknown) {
            s.stop(pc.red(`Failed to save API key: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
    .command("create [idea]")
    .description("Scaffold a new application from a natural language idea.")
    .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
    .action(async (idea, options) => {
        try {
            const { CLIController } = await import("./CLIController");
            const cli = new CLIController();
            await cli.handleCreateCommand(idea, options);
        } catch (err: unknown) {
            const pc = (await import("picocolors")).default;
            console.error(pc.red(`\n✖ Failed to execute create command: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    });

// ─────────────────────────────────────
// agentforge list
// ─────────────────────────────────────
program
    .command("list")
    .description("List all available project templates.")
    .action(async () => {
        const [{ default: pc }, { TemplateManager }] = await Promise.all([
            import("picocolors"),
            import("../templates/TemplateManager")
        ]);
        const templateManager = new TemplateManager();
        try {
            const templates = await templateManager.listTemplates();
            console.log(pc.cyan(`\n✨ Available Templates:\n`));
            templates.forEach((t) => {
                const icons: Record<string, string> = {
                    "saas": "🏢",
                    "landing-api": "🚀",
                    "realtime": "💬",
                };
                console.log(pc.white(`  ${icons[t] || "📦"}  ${pc.bold(t)}`));
            });
            console.log();
        } catch (err: unknown) {
            console.error(pc.red(`\n✖ Failed to list templates: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    });

// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
        const [{ default: pc }, { PreviewServer }] = await Promise.all([
            import("picocolors"),
            import("../preview-server/PreviewServer")
        ]);
        const preview = new PreviewServer();
        try {
            await preview.start(targetPath);
        } catch (err: unknown) {
            console.error(pc.red(`\n✖ Preview server failed: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    });

program.parse();
