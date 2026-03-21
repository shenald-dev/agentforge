#!/usr/bin/env node
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const CLIController_1 = require("./CLIController");
const ProjectGenerator_1 = require("../generators/ProjectGenerator");
const TemplateManager_1 = require("../templates/TemplateManager");
const PreviewServer_1 = require("../preview-server/PreviewServer");
const LLMOptimizer_1 = require("../integrations/LLMOptimizer");
const program = new commander_1.Command();
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
    const cli = new CLIController_1.CLIController();
    const generator = new ProjectGenerator_1.ProjectGenerator();
    const templateManager = new TemplateManager_1.TemplateManager();
    try {
        const answers = await cli.promptCreationDetails(idea);
        const templatePath = await templateManager.getTemplatePath(answers.template);
        const outputPath = path.resolve(process.cwd(), answers.projectName);
        const spinner = (0, ora_1.default)(`Forging project '${answers.projectName}'...`).start();
        await generator.generate({
            projectName: answers.projectName,
            idea: answers.idea,
            templatePath: templatePath,
            outputPath: outputPath
        });
        spinner.succeed(chalk_1.default.green(`✨ Project scaffolded!`));
        // Run LLM enhancement and npm install concurrently to reduce wait times
        const llmTask = (async () => {
            if (options.llm !== false) {
                const optimizer = new LLMOptimizer_1.LLMOptimizer();
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
                console.log(chalk_1.default.gray(`  ⏭  LLM enhancement skipped (--no-llm flag)`));
            }
        })();
        const npmInstallTask = (async () => {
            const installSpinner = (0, ora_1.default)("Installing dependencies in generated project...").start();
            return new Promise((resolve) => {
                const install = (0, child_process_1.spawn)("npm", ["install"], {
                    cwd: outputPath,
                    stdio: "ignore",
                    shell: false,
                });
                install.on("close", (code) => {
                    if (code === 0) {
                        installSpinner.succeed(chalk_1.default.green("Dependencies installed!"));
                        resolve();
                    }
                    else {
                        installSpinner.warn(chalk_1.default.yellow("npm install returned non-zero. You may need to install dependencies manually."));
                        resolve(); // Don't block on install failure
                    }
                });
                install.on("error", () => {
                    installSpinner.warn(chalk_1.default.yellow("Could not run npm install automatically."));
                    resolve();
                });
            });
        })();
        await Promise.all([llmTask, npmInstallTask]);
        console.log(chalk_1.default.cyan(`\n🎉 Successfully crafted ${chalk_1.default.bold(answers.projectName)} using the ${chalk_1.default.bold(answers.template)} template!\n`));
        console.log(chalk_1.default.white(`Next steps:`));
        console.log(chalk_1.default.cyan(`  $ cd ${answers.projectName}`));
        console.log(chalk_1.default.cyan(`  $ agentforge preview .`));
        console.log();
    }
    catch (err) {
        console.error(chalk_1.default.red(`\n✖ Generation failed: ${err.message}`));
    }
});
// ─────────────────────────────────────
// agentforge list
// ─────────────────────────────────────
program
    .command("list")
    .description("List all available project templates.")
    .action(async () => {
    const templateManager = new TemplateManager_1.TemplateManager();
    try {
        const templates = await templateManager.listTemplates();
        console.log(chalk_1.default.cyan(`\n✨ Available Templates:\n`));
        templates.forEach((t, i) => {
            const icons = {
                "saas": "🏢",
                "landing-api": "🚀",
                "realtime": "💬",
            };
            console.log(chalk_1.default.white(`  ${icons[t] || "📦"}  ${chalk_1.default.bold(t)}`));
        });
        console.log();
    }
    catch (err) {
        console.error(chalk_1.default.red(`\n✖ Failed to list templates: ${err.message}`));
    }
});
// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
    const preview = new PreviewServer_1.PreviewServer();
    try {
        await preview.start(targetPath);
    }
    catch (err) {
        console.error(chalk_1.default.red(`\n✖ Preview server failed: ${err.message}`));
    }
});
program.parse();
