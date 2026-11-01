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
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
const picocolors_1 = __importDefault(require("picocolors"));
const p = __importStar(require("@clack/prompts"));
const TemplateManager_1 = require("../templates/TemplateManager");
const ProjectGenerator_1 = require("../generators/ProjectGenerator");
const ArchitecturePlanner_1 = require("../generators/ArchitecturePlanner");
const SystemDoctor_1 = require("../diagnostics/SystemDoctor");
class CLIController {
    templateManager;
    generator;
    planner;
    doctor;
    constructor() {
        this.templateManager = new TemplateManager_1.TemplateManager();
        this.generator = new ProjectGenerator_1.ProjectGenerator();
        this.planner = new ArchitecturePlanner_1.ArchitecturePlanner();
        this.doctor = new SystemDoctor_1.SystemDoctor();
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
                },
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
                },
            }),
            template: () => p.select({
                message: "Which scaffold template best fits your architecture?",
                options: templates.map((t) => ({ value: t, label: t })),
            }),
        }, {
            onCancel: () => {
                p.cancel("Operation cancelled.");
                process.exit(0);
            },
        });
        return project;
    }
    /**
     * Handles the creation command in interactive or scriptable non-interactive mode.
     */
    async handleCreateCommand(idea, options = {}) {
        try {
            let answers;
            // Non-interactive / scripted flow if required options are provided
            if (options.name && options.template) {
                if (!/^[a-z0-9-]+$/.test(options.name)) {
                    throw new Error("Project name may only include lowercase letters, numbers, and dashes.");
                }
                const effectiveIdea = idea || "A stunning new web app.";
                if (effectiveIdea.length > 200) {
                    throw new Error("Idea is too long (maximum 200 characters).");
                }
                if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(effectiveIdea)) {
                    throw new Error("Idea may only include letters, numbers, spaces, and basic punctuation.");
                }
                answers = {
                    projectName: options.name,
                    idea: effectiveIdea,
                    template: options.template,
                };
            }
            else {
                answers = (await this.promptCreationDetails(idea));
            }
            const templatePath = await this.templateManager.getTemplatePath(answers.template);
            const outputPath = options.output
                ? path.resolve(process.cwd(), options.output)
                : path.resolve(process.cwd(), answers.projectName);
            // Dry run mode simulation
            if (options.dryRun) {
                const dryResult = await this.generator.generate({
                    projectName: answers.projectName,
                    idea: answers.idea,
                    templatePath: templatePath,
                    outputPath: outputPath,
                    dryRun: true,
                });
                console.log(picocolors_1.default.bold(picocolors_1.default.cyan(`\n🔍 AgentForge Dry Run Preview:`)));
                console.log(picocolors_1.default.gray(`Output Location: ${outputPath}`));
                console.log(picocolors_1.default.gray(`Template: ${answers.template}\n`));
                console.log(picocolors_1.default.yellow(`Files that would be generated (${dryResult.totalFiles} files):`));
                dryResult.files.forEach((f) => {
                    const badge = f.isTemplate ? picocolors_1.default.magenta("[compiled]") : picocolors_1.default.dim("[static]");
                    console.log(`  ${picocolors_1.default.green("+")} ${f.relativePath} ${badge}`);
                });
                console.log(picocolors_1.default.dim("\nDry run complete. No files were written to disk.\n"));
                return;
            }
            const s = p.spinner();
            s.start(`Forging project '${answers.projectName}'...`);
            const genResult = await this.generator.generate({
                projectName: answers.projectName,
                idea: answers.idea,
                templatePath: templatePath,
                outputPath: outputPath,
                force: options.force,
            });
            s.stop(picocolors_1.default.green(`✨ Project scaffolded successfully! (${genResult.totalFiles} files)`));
            // ── Architectural Specification Generation ──
            if (options.plan !== false) {
                const planSpinner = p.spinner();
                planSpinner.start("Generating system architecture blueprint (ARCHITECTURE.md)...");
                try {
                    await this.planner.generateArchitecturePlan({
                        projectName: answers.projectName,
                        idea: answers.idea,
                        template: answers.template,
                        outputPath: outputPath,
                        enableLLM: options.llm !== false,
                    });
                    planSpinner.stop(picocolors_1.default.green("📐 System architecture blueprint generated (ARCHITECTURE.md)!"));
                }
                catch (err) {
                    planSpinner.stop(picocolors_1.default.yellow(`⚠️ Architecture plan fallback used: ${err instanceof Error ? err.message : String(err)}`));
                }
            }
            // ── Optional LLM Enhancement ──
            if (options?.llm !== false) {
                const [{ LLMOptimizer }] = await Promise.all([Promise.resolve().then(() => __importStar(require("../integrations/LLMOptimizer")))]);
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
            if (options.skipInstall) {
                p.log.warn(picocolors_1.default.gray("⏭  Dependency installation skipped (--skip-install flag)"));
            }
            else {
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
            }
            p.outro(picocolors_1.default.cyan(`🎉 Successfully crafted ${picocolors_1.default.bold(answers.projectName)} using the ${picocolors_1.default.bold(answers.template)} template!`));
            p.log.message(picocolors_1.default.white(`Next steps:`));
            p.log.step(picocolors_1.default.cyan(`$ cd ${options.output || answers.projectName}`));
            p.log.step(picocolors_1.default.cyan(`$ agentforge preview .`));
        }
        catch (err) {
            p.cancel(picocolors_1.default.red(`\n✖ Generation failed: ${err instanceof Error ? err.message : String(err)}`));
            process.exit(1);
        }
    }
    /**
     * Displays in-depth information and stack metadata for a template.
     */
    async handleInfoCommand(templateName) {
        const meta = await this.templateManager.getTemplateMetadata(templateName);
        if (!meta) {
            console.error(picocolors_1.default.red(`\n✖ Template '${templateName}' does not exist.`));
            process.exit(1);
        }
        console.log(picocolors_1.default.bold(picocolors_1.default.cyan(`\n${meta.icon} Template: ${meta.displayName} (${meta.name})\n`)));
        console.log(`  ${picocolors_1.default.bold("Description:")}  ${meta.description}`);
        console.log(`  ${picocolors_1.default.bold("Category:")}     ${meta.category}`);
        console.log(`  ${picocolors_1.default.bold("Tech Stack:")}   ${meta.stack.join(", ")}`);
        console.log(`  ${picocolors_1.default.bold("Default Ports:")} Frontend: http://localhost:${meta.ports.frontend} | Backend: http://localhost:${meta.ports.backend}`);
        console.log();
    }
    /**
     * Runs complete system diagnostics and prints health status.
     */
    async handleDoctorCommand() {
        const s = p.spinner();
        s.start("Scanning developer environment and container runtime...");
        const report = await this.doctor.runDiagnostics();
        s.stop(picocolors_1.default.green("Environment scan completed!"));
        const formatted = this.doctor.formatReport(report);
        console.log(formatted);
        if (!report.allHealthy) {
            process.exit(1);
        }
    }
}
exports.CLIController = CLIController;
