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
exports.CLIController = void 0;
const TemplateManager_1 = require("../templates/TemplateManager");
const ProjectGenerator_1 = require("../generators/ProjectGenerator");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
// Statically import heavy UI modules as CLIController is already dynamically lazy-loaded
const picocolors_1 = __importDefault(require("picocolors"));
const p = __importStar(require("@clack/prompts"));
class CLIController {
    templateManager;
    generator;
    constructor() {
        this.templateManager = new TemplateManager_1.TemplateManager();
        this.generator = new ProjectGenerator_1.ProjectGenerator();
    }
    /**
     * Guides the user through an interactive setup process for generation.
     */
    async promptCreationDetails(defaultIdea) {
        console.clear();
        p.intro(`${picocolors_1.default.bgCyan(picocolors_1.default.black(" ✨ AgentForge Interactive Scaffolding "))}`);
        const templates = await this.templateManager.listTemplates();
        const project = await p.group({
            projectName: () => p.text({
                message: "What is the name of your new application?",
                placeholder: "my-vibe-app",
                defaultValue: "my-vibe-app",
                validate: (value) => {
                    if (!value)
                        return "Please enter a name.";
                    if (!/^[a-z0-9-]+$/.test(value))
                        return "Project name may only include lowercase letters, numbers, and dashes.";
                }
            }),
            idea: () => p.text({
                message: "Describe your idea in one sentence:",
                placeholder: defaultIdea || "A stunning new web app.",
                defaultValue: defaultIdea || "A stunning new web app.",
                validate: (value) => {
                    if (!value || value.trim().length === 0)
                        return "Please enter an idea.";
                    if (value.length > 200)
                        return "Idea is too long (maximum 200 characters).";
                    if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(value))
                        return "Idea may only include letters, numbers, spaces, and basic punctuation.";
                }
            }),
            template: () => p.select({
                message: "Which scaffold template best fits your architecture?",
                options: templates.map(t => ({ value: t, label: t })),
            })
        }, {
            onCancel: () => {
                p.cancel("Operation cancelled.");
                process.exit(0);
            }
        });
        return project;
    }
    /**
     * Handles the creation command.
     */
    async handleCreateCommand(idea, options) {
        try {
            const answers = await this.promptCreationDetails(idea);
            const templatePath = await this.templateManager.getTemplatePath(answers.template);
            const outputPath = path.resolve(process.cwd(), answers.projectName);
            const s = p.spinner();
            s.start(`Forging project '${answers.projectName}'...`);
            await this.generator.generate({
                projectName: answers.projectName,
                idea: answers.idea,
                templatePath: templatePath,
                outputPath: outputPath
            });
            s.stop(picocolors_1.default.green(`✨ Project scaffolded successfully!`));
            // ── Optional LLM Enhancement ──
            if (options.llm !== false) {
                const [{ LLMOptimizer }] = await Promise.all([
                    Promise.resolve().then(() => __importStar(require("../integrations/LLMOptimizer")))
                ]);
                const optimizer = new LLMOptimizer();
                const readmePath = path.join(outputPath, "README.md");
                try {
                    const currentReadme = await promises_1.default.readFile(readmePath, "utf-8");
                    const enhancedReadme = await optimizer.enhanceReadme(answers.idea, currentReadme);
                    await promises_1.default.writeFile(readmePath, enhancedReadme, "utf-8");
                }
                catch (err) {
                    if (err.code === "ENOENT") {
                        p.log.warn(picocolors_1.default.yellow(`⚠️  README.md not found in generated project, skipping enhancement.`));
                    }
                    else {
                        p.log.warn(picocolors_1.default.yellow(`⚠️  Failed to enhance README: ${err instanceof Error ? err.message : String(err)}`));
                    }
                }
            }
            else {
                p.log.warn(picocolors_1.default.gray(`⏭  LLM enhancement skipped (--no-llm flag)`));
            }
            // ── Post-generation npm install ──
            const installSpinner = p.spinner();
            installSpinner.start("Installing dependencies in generated project...");
            await new Promise((resolve) => {
                const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
                const install = (0, child_process_1.spawn)(npmCmd, ["install"], {
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
            p.cancel(picocolors_1.default.red(`\n✖ Generation failed: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    }
}
exports.CLIController = CLIController;
