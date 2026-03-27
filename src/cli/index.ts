#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import * as p from "@clack/prompts";
import * as path from "path";
import { spawn } from "child_process";

const program = new Command();

program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version("3.0.0");

// ─────────────────────────────────────
// agentforge auth
// ─────────────────────────────────────
program
    .command("auth")
    .description("Set your OpenRouter API key for LLM enchantments securely.")
    .action(async () => {
        const { ConfigManager } = await import("../utils/config");
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
        await configManager.setConfig({ OPENROUTER_API_KEY: apiKey as string });
        s.stop(pc.green("API key saved securely to ~/.agentforge/config.json"));
        
        p.outro(pc.cyan("You're ready to forge!"));
    });

// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
    .command("create [idea]")
    .description("Scaffold a new application from a natural language idea.")
    .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
    .action(async (idea, options) => {
        const { CLIController } = await import("./CLIController");
        const { ProjectGenerator } = await import("../generators/ProjectGenerator");
        const { TemplateManager } = await import("../templates/TemplateManager");

        const cli = new CLIController();
        const generator = new ProjectGenerator();
        const templateManager = new TemplateManager();

        try {
            const answers = await cli.promptCreationDetails(idea);
            const templatePath = await templateManager.getTemplatePath(answers.template);
            const outputPath = path.resolve(process.cwd(), answers.projectName);

            const s = p.spinner();
            s.start(`Forging project '${answers.projectName}'...`);

            await generator.generate({
                projectName: answers.projectName,
                idea: answers.idea,
                templatePath: templatePath,
                outputPath: outputPath
            });

            s.stop(pc.green(`✨ Project scaffolded successfully!`));

            // ── Optional LLM Enhancement ──
            if (options.llm !== false) {
                const { LLMOptimizer } = await import("../integrations/LLMOptimizer");
                const optimizer = new LLMOptimizer();
                const fs = await import("fs/promises");
                const readmePath = path.join(outputPath, "README.md");
                try {
                    const currentReadme = await fs.readFile(readmePath, "utf-8");
                    const enhancedReadme = await optimizer.enhanceReadme(answers.idea, currentReadme);
                    await fs.writeFile(readmePath, enhancedReadme, "utf-8");
                } catch {
                    // Silently skip if README doesn't exist
                }
            } else {
                p.log.warn(pc.gray(`⏭  LLM enhancement skipped (--no-llm flag)`));
            }

            // ── Post-generation npm install ──
            const installSpinner = p.spinner();
            installSpinner.start("Installing dependencies in generated project...");
            await new Promise<void>((resolve, reject) => {
                const install = spawn("npm", ["install"], {
                    cwd: outputPath,
                    stdio: "pipe",
                    shell: true,
                });
                install.on("close", (code) => {
                    if (code === 0) {
                        installSpinner.stop(pc.green("Dependencies installed!"));
                        resolve();
                    } else {
                        installSpinner.stop(pc.yellow("npm install returned non-zero. You may need to install dependencies manually."));
                        resolve(); // Don't block on install failure
                    }
                });
                install.on("error", () => {
                    installSpinner.stop(pc.yellow("Could not run npm install automatically."));
                    resolve();
                });
            });

            p.outro(pc.cyan(`🎉 Successfully crafted ${pc.bold(answers.projectName)} using the ${pc.bold(answers.template)} template!`));
            
            p.log.message(pc.white(`Next steps:`));
            p.log.step(pc.cyan(`$ cd ${answers.projectName}`));
            p.log.step(pc.cyan(`$ agentforge preview .`));

        } catch (err: any) {
            p.cancel(pc.red(`\n✖ Generation failed: ${err.message}`));
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
        const { TemplateManager } = await import("../templates/TemplateManager");
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
        } catch (err: any) {
            console.error(pc.red(`\n✖ Failed to list templates: ${err.message}`));
        }
    });

// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
        const { PreviewServer } = await import("../preview-server/PreviewServer");
        const preview = new PreviewServer();
        try {
            await preview.start(targetPath);
        } catch (err: any) {
            console.error(pc.red(`\n✖ Preview server failed: ${err.message}`));
        }
    });

program.parse();
