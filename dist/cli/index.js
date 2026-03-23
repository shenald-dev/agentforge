#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
<<<<<<< HEAD
const chalk_1 = __importDefault(require("chalk"));
=======
const picocolors_1 = __importDefault(require("picocolors"));
const p = __importStar(require("@clack/prompts"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const TemplateManager_1 = require("../templates/TemplateManager");
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)
const program = new commander_1.Command();
program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
<<<<<<< HEAD
    .version("1.0.0");
program
    .command("create <idea>")
    .description("Scaffold a new application from a short natural language idea.")
    .action((idea) => {
    console.log(chalk_1.default.cyanBright(`\n✨ AgentForge initiating creation sequence for idea: `) + chalk_1.default.yellow(`"${idea}"`));
    // TODO: Implement generation logic
=======
    .version("3.0.0");
// ─────────────────────────────────────
// agentforge auth
// ─────────────────────────────────────
program
    .command("auth")
    .description("Set your OpenRouter API key for LLM enchantments securely.")
    .action(async () => {
    const { ConfigManager } = await Promise.resolve().then(() => __importStar(require("../utils/config")));
    const configManager = new ConfigManager();
    p.intro(picocolors_1.default.bgCyan(picocolors_1.default.black(" AgentForge Configuration ")));
    const apiKey = await p.password({
        message: "Enter your OpenRouter API key:",
        validate: (value) => {
            if (!value)
                return "API key cannot be empty.";
        }
    });
    if (p.isCancel(apiKey)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
    }
    const s = p.spinner();
    s.start("Saving API key securely...");
    await configManager.setConfig({ OPENROUTER_API_KEY: apiKey });
    s.stop(picocolors_1.default.green("API key saved securely to ~/.agentforge/config.json"));
    p.outro(picocolors_1.default.cyan("You're ready to forge!"));
});
// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
    .command("create [idea]")
    .description("Scaffold a new application from a natural language idea.")
    .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
    .action(async (idea, options) => {
    const { CLIController } = await Promise.resolve().then(() => __importStar(require("./CLIController")));
    const { ProjectGenerator } = await Promise.resolve().then(() => __importStar(require("../generators/ProjectGenerator")));
    const cli = new CLIController();
    const generator = new ProjectGenerator();
    const templateManager = new TemplateManager_1.TemplateManager();
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
        s.stop(picocolors_1.default.green(`✨ Project scaffolded successfully!`));
        // ── Optional LLM Enhancement ──
        if (options.llm !== false) {
            const { LLMOptimizer } = await Promise.resolve().then(() => __importStar(require("../integrations/LLMOptimizer")));
            const optimizer = new LLMOptimizer();
            const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
            const readmePath = path.join(outputPath, "README.md");
            try {
                const currentReadme = await fs.readFile(readmePath, "utf-8");
                const enhancedReadme = await optimizer.enhanceReadme(answers.idea, currentReadme);
                await fs.writeFile(readmePath, enhancedReadme, "utf-8");
            }
            catch {
                // Silently skip if README doesn't exist
            }
        }
        else {
            p.log.warn(picocolors_1.default.gray(`⏭  LLM enhancement skipped (--no-llm flag)`));
        }
        // ── Post-generation npm install ──
        const installSpinner = p.spinner();
        installSpinner.start("Installing dependencies in generated project...");
        await new Promise((resolve, reject) => {
            const install = (0, child_process_1.spawn)("npm", ["install"], {
                cwd: outputPath,
                stdio: "ignore",
                shell: false,
            });
            install.on("close", (code) => {
                if (code === 0) {
                    installSpinner.stop(picocolors_1.default.green("Dependencies installed!"));
                    resolve();
                }
                else {
                    installSpinner.stop(picocolors_1.default.yellow("npm install returned non-zero. You may need to install dependencies manually."));
                    resolve(); // Don't block on install failure
                }
            });
            install.on("error", () => {
                installSpinner.stop(picocolors_1.default.yellow("Could not run npm install automatically."));
                resolve();
            });
        });
        p.outro(picocolors_1.default.cyan(`🎉 Successfully crafted ${picocolors_1.default.bold(answers.projectName)} using the ${picocolors_1.default.bold(answers.template)} template!`));
        p.log.message(picocolors_1.default.white(`Next steps:`));
        p.log.step(picocolors_1.default.cyan(`$ cd ${answers.projectName}`));
        p.log.step(picocolors_1.default.cyan(`$ agentforge preview .`));
    }
    catch (err) {
        p.cancel(picocolors_1.default.red(`\n✖ Generation failed: ${err.message}`));
        process.exit(1);
    }
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)
});
program
<<<<<<< HEAD
    .command("preview <path>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action((path) => {
    console.log(chalk_1.default.magentaBright(`\n🐳 Preparing preview container from path: `) + chalk_1.default.white(`${path}`));
    // TODO: Implement preview logic
=======
    .command("list")
    .description("List all available project templates.")
    .action(async () => {
    const templateManager = new TemplateManager_1.TemplateManager();
    try {
        const templates = await templateManager.listTemplates();
        console.log(picocolors_1.default.cyan(`\n✨ Available Templates:\n`));
        templates.forEach((t) => {
            const icons = {
                "saas": "🏢",
                "landing-api": "🚀",
                "realtime": "💬",
            };
            console.log(picocolors_1.default.white(`  ${icons[t] || "📦"}  ${picocolors_1.default.bold(t)}`));
        });
        console.log();
    }
    catch (err) {
        console.error(picocolors_1.default.red(`\n✖ Failed to list templates: ${err.message}`));
    }
});
// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
    const { PreviewServer } = await Promise.resolve().then(() => __importStar(require("../preview-server/PreviewServer")));
    const preview = new PreviewServer();
    try {
        await preview.start(targetPath);
    }
    catch (err) {
        console.error(picocolors_1.default.red(`\n✖ Preview server failed: ${err.message}`));
    }
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)
});
program.parse();
