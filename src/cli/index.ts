#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { spawn } from "child_process";
import { CLIController } from "./CLIController";
import { ProjectGenerator } from "../generators/ProjectGenerator";
import { TemplateManager } from "../templates/TemplateManager";
import { PreviewServer } from "../preview-server/PreviewServer";
import { LLMOptimizer } from "../integrations/LLMOptimizer";

const program = new Command();

program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version("2.0.0");

// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
    .command("create [idea]")
    .description("Scaffold a new application from a natural language idea.")
    .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
    .action(async (idea, options) => {
        const cli = new CLIController();
        const generator = new ProjectGenerator();
        const templateManager = new TemplateManager();

        try {
            const answers = await cli.promptCreationDetails(idea);
            const templatePath = await templateManager.getTemplatePath(answers.template);
            const outputPath = path.resolve(process.cwd(), answers.projectName);

            const spinner = ora(`Forging project '${answers.projectName}'...`).start();

            await generator.generate({
                projectName: answers.projectName,
                idea: answers.idea,
                templatePath: templatePath,
                outputPath: outputPath
            });

            spinner.succeed(chalk.green(`✨ Project scaffolded!`));

            // ── Optional LLM Enhancement ──
            if (options.llm !== false) {
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
                console.log(chalk.gray(`  ⏭  LLM enhancement skipped (--no-llm flag)`));
            }

            // ── Post-generation npm install ──
            const installSpinner = ora("Installing dependencies in generated project...").start();
            await new Promise<void>((resolve, reject) => {
                const install = spawn("npm", ["install"], {
                    cwd: outputPath,
                    stdio: "pipe",
                    shell: true,
                });
                install.on("close", (code) => {
                    if (code === 0) {
                        installSpinner.succeed(chalk.green("Dependencies installed!"));
                        resolve();
                    } else {
                        installSpinner.warn(chalk.yellow("npm install returned non-zero. You may need to install dependencies manually."));
                        resolve(); // Don't block on install failure
                    }
                });
                install.on("error", () => {
                    installSpinner.warn(chalk.yellow("Could not run npm install automatically."));
                    resolve();
                });
            });

            console.log(chalk.cyan(`\n🎉 Successfully crafted ${chalk.bold(answers.projectName)} using the ${chalk.bold(answers.template)} template!\n`));
            console.log(chalk.white(`Next steps:`));
            console.log(chalk.cyan(`  $ cd ${answers.projectName}`));
            console.log(chalk.cyan(`  $ agentforge preview .`));
            console.log();

        } catch (err: any) {
            console.error(chalk.red(`\n✖ Generation failed: ${err.message}`));
        }
    });

// ─────────────────────────────────────
// agentforge list
// ─────────────────────────────────────
program
    .command("list")
    .description("List all available project templates.")
    .action(async () => {
        const templateManager = new TemplateManager();
        try {
            const templates = await templateManager.listTemplates();
            console.log(chalk.cyan(`\n✨ Available Templates:\n`));
            templates.forEach((t, i) => {
                const icons: Record<string, string> = {
                    "saas": "🏢",
                    "landing-api": "🚀",
                    "realtime": "💬",
                };
                console.log(chalk.white(`  ${icons[t] || "📦"}  ${chalk.bold(t)}`));
            });
            console.log();
        } catch (err: any) {
            console.error(chalk.red(`\n✖ Failed to list templates: ${err.message}`));
        }
    });

// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
        const preview = new PreviewServer();
        try {
            await preview.start(targetPath);
        } catch (err: any) {
            console.error(chalk.red(`\n✖ Preview server failed: ${err.message}`));
        }
    });

program.parse();
