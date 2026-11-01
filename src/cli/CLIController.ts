import * as path from "path";
import { spawn } from "child_process";
import fs from "fs/promises";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { TemplateManager } from "../templates/TemplateManager";
import { ProjectGenerator } from "../generators/ProjectGenerator";
import { ArchitecturePlanner } from "../generators/ArchitecturePlanner";
import { SystemDoctor } from "../diagnostics/SystemDoctor";

export interface CreateCommandOptions {
  name?: string;
  template?: string;
  output?: string;
  llm?: boolean;
  skipInstall?: boolean;
  dryRun?: boolean;
  plan?: boolean;
  force?: boolean;
}

export class CLIController {
  private templateManager: TemplateManager;
  private generator: ProjectGenerator;
  private planner: ArchitecturePlanner;
  private doctor: SystemDoctor;

  constructor() {
    this.templateManager = new TemplateManager();
    this.generator = new ProjectGenerator();
    this.planner = new ArchitecturePlanner();
    this.doctor = new SystemDoctor();
  }

  /**
   * Guides the user through an interactive setup process for generation.
   */
  async promptCreationDetails(defaultIdea: string) {
    console.clear();
    p.intro(`${pc.bgCyan(pc.black(" ✨ AgentForge Interactive Scaffolding "))}`);

    const templates = await this.templateManager.listTemplates();

    const project = await p.group(
      {
        projectName: () =>
          p.text({
            message: "What is the name of your new application?",
            placeholder: "my-vibe-app",
            defaultValue: "my-vibe-app",
            validate: (value?: string) => {
              if (!value) return "Please enter a name.";
              if (!/^[a-z0-9-]+$/.test(value))
                return "Project name may only include lowercase letters, numbers, and dashes.";
            },
          }),
        idea: () =>
          p.text({
            message: "Describe your idea in one sentence:",
            placeholder: defaultIdea || "A stunning new web app.",
            defaultValue: defaultIdea || "A stunning new web app.",
            validate: (value?: string) => {
              if (!value || value.trim().length === 0) return "Please enter an idea.";
              if (value.length > 200) return "Idea is too long (maximum 200 characters).";
              if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(value))
                return "Idea may only include letters, numbers, spaces, and basic punctuation.";
            },
          }),
        template: () =>
          p.select({
            message: "Which scaffold template best fits your architecture?",
            options: templates.map((t) => ({ value: t, label: t })),
          }),
      },
      {
        onCancel: () => {
          p.cancel("Operation cancelled.");
          process.exit(0);
        },
      },
    );

    return project;
  }

  /**
   * Handles the creation command in interactive or scriptable non-interactive mode.
   */
  async handleCreateCommand(idea: string, options: CreateCommandOptions = {}) {
    try {
      let answers: { projectName: string; idea: string; template: string };

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
      } else {
        answers = (await this.promptCreationDetails(idea)) as any;
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

        console.log(pc.bold(pc.cyan(`\n🔍 AgentForge Dry Run Preview:`)));
        console.log(pc.gray(`Output Location: ${outputPath}`));
        console.log(pc.gray(`Template: ${answers.template}\n`));
        console.log(pc.yellow(`Files that would be generated (${dryResult.totalFiles} files):`));

        dryResult.files.forEach((f) => {
          const badge = f.isTemplate ? pc.magenta("[compiled]") : pc.dim("[static]");
          console.log(`  ${pc.green("+")} ${f.relativePath} ${badge}`);
        });

        console.log(pc.dim("\nDry run complete. No files were written to disk.\n"));
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

      s.stop(pc.green(`✨ Project scaffolded successfully! (${genResult.totalFiles} files)`));

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
          planSpinner.stop(pc.green("📐 System architecture blueprint generated (ARCHITECTURE.md)!"));
        } catch (err: unknown) {
          planSpinner.stop(
            pc.yellow(`⚠️ Architecture plan fallback used: ${err instanceof Error ? err.message : String(err)}`),
          );
        }
      }

      // ── Optional LLM Enhancement ──
      if (options?.llm !== false) {
        const [{ LLMOptimizer }] = await Promise.all([import("../integrations/LLMOptimizer")]);
        const optimizer = new LLMOptimizer();
        const readmePath = path.join(outputPath, "README.md");
        try {
          const currentReadme = await fs.readFile(readmePath, "utf-8");
          const enhancedReadme = await optimizer.enhanceReadme(answers.idea, currentReadme);
          await fs.writeFile(readmePath, enhancedReadme, "utf-8");
        } catch (err: any) {
          if (err.code === "ENOENT") {
            p.log.warn(pc.yellow(`⚠️  README.md not found in generated project, skipping enhancement.`));
          } else {
            p.log.warn(
              pc.yellow(`⚠️  Failed to enhance README: ${err instanceof Error ? err.message : String(err)}`),
            );
          }
        }
      } else {
        p.log.warn(pc.gray(`⏭  LLM enhancement skipped (--no-llm flag)`));
      }

      // ── Post-generation npm install ──
      if (options.skipInstall) {
        p.log.warn(pc.gray("⏭  Dependency installation skipped (--skip-install flag)"));
      } else {
        const installSpinner = p.spinner();
        installSpinner.start("Installing dependencies in generated project...");
        await new Promise<void>((resolve) => {
          const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
          const install = spawn(npmCmd, ["install"], {
            cwd: outputPath,
            stdio: "ignore",
            shell: false,
          });
          install.on("close", (code) => {
            if (code === 0) {
              installSpinner.stop(pc.green("Dependencies installed!"));
              resolve();
            } else {
              installSpinner.stop(
                pc.yellow("npm install returned non-zero. You may need to install dependencies manually."),
              );
              resolve(); // Don't block on install failure
            }
          });
          install.on("error", () => {
            installSpinner.stop(pc.yellow("Could not run npm install automatically."));
            resolve();
          });
        });
      }

      p.outro(
        pc.cyan(
          `🎉 Successfully crafted ${pc.bold(answers.projectName)} using the ${pc.bold(answers.template)} template!`,
        ),
      );

      p.log.message(pc.white(`Next steps:`));
      p.log.step(pc.cyan(`$ cd ${options.output || answers.projectName}`));
      p.log.step(pc.cyan(`$ agentforge preview .`));
    } catch (err: unknown) {
      p.cancel(pc.red(`\n✖ Generation failed: ${err instanceof Error ? err.message : String(err)}`));
      process.exit(1);
    }
  }

  /**
   * Displays in-depth information and stack metadata for a template.
   */
  async handleInfoCommand(templateName: string): Promise<void> {
    const meta = await this.templateManager.getTemplateMetadata(templateName);
    if (!meta) {
      console.error(pc.red(`\n✖ Template '${templateName}' does not exist.`));
      process.exit(1);
    }

    console.log(pc.bold(pc.cyan(`\n${meta.icon} Template: ${meta.displayName} (${meta.name})\n`)));
    console.log(`  ${pc.bold("Description:")}  ${meta.description}`);
    console.log(`  ${pc.bold("Category:")}     ${meta.category}`);
    console.log(`  ${pc.bold("Tech Stack:")}   ${meta.stack.join(", ")}`);
    console.log(`  ${pc.bold("Default Ports:")} Frontend: http://localhost:${meta.ports.frontend} | Backend: http://localhost:${meta.ports.backend}`);
    console.log();
  }

  /**
   * Runs complete system diagnostics and prints health status.
   */
  async handleDoctorCommand(): Promise<void> {
    const s = p.spinner();
    s.start("Scanning developer environment and container runtime...");
    const report = await this.doctor.runDiagnostics();
    s.stop(pc.green("Environment scan completed!"));

    const formatted = this.doctor.formatReport(report);
    console.log(formatted);

    if (!report.allHealthy) {
      process.exit(1);
    }
  }
}
