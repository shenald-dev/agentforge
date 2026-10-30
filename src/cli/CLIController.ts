import { TemplateManager } from "../templates/TemplateManager";
import { ProjectGenerator } from "../generators/ProjectGenerator";
import * as path from "path";
import { spawn } from "child_process";
import fs from "fs/promises";
// Statically import heavy UI modules as CLIController is already dynamically lazy-loaded
import pc from "picocolors";
import * as p from "@clack/prompts";

export class CLIController {
  private templateManager: TemplateManager;
  private generator: ProjectGenerator;

  constructor() {
    this.templateManager = new TemplateManager();
    this.generator = new ProjectGenerator();
  }

  /**
   * Guides the user through an interactive setup process for generation.
   */
  async promptCreationDetails(defaultIdea: string) {
    console.clear();
    p.intro(
      `${pc.bgCyan(pc.black(" ✨ AgentForge Interactive Scaffolding "))}`,
    );

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
              if (!value || value.trim().length === 0)
                return "Please enter an idea.";
              if (value.length > 200)
                return "Idea is too long (maximum 200 characters).";
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
   * Handles the creation command.
   */
  async handleCreateCommand(idea: string, options: any) {
    try {
      const answers = await this.promptCreationDetails(idea);
      const templatePath = await this.templateManager.getTemplatePath(
        answers.template,
      );
      const outputPath = path.resolve(process.cwd(), answers.projectName);

      const s = p.spinner();
      s.start(`Forging project '${answers.projectName}'...`);

      await this.generator.generate({
        projectName: answers.projectName,
        idea: answers.idea,
        templatePath: templatePath,
        outputPath: outputPath,
      });

      s.stop(pc.green(`✨ Project scaffolded successfully!`));

      // ── Optional LLM Enhancement ──
      if (options.llm !== false) {
        const [{ LLMOptimizer }] = await Promise.all([
          import("../integrations/LLMOptimizer"),
        ]);
        const optimizer = new LLMOptimizer();
        const readmePath = path.join(outputPath, "README.md");
        try {
          const currentReadme = await fs.readFile(readmePath, "utf-8");
          const enhancedReadme = await optimizer.enhanceReadme(
            answers.idea,
            currentReadme,
          );
          await fs.writeFile(readmePath, enhancedReadme, "utf-8");
        } catch (err: any) {
          if (err.code === "ENOENT") {
            p.log.warn(
              pc.yellow(
                `⚠️  README.md not found in generated project, skipping enhancement.`,
              ),
            );
          } else {
            p.log.warn(
              pc.yellow(
                `⚠️  Failed to enhance README: ${err instanceof Error ? err.message : String(err)}`,
              ),
            );
          }
        }
      } else {
        p.log.warn(pc.gray(`⏭  LLM enhancement skipped (--no-llm flag)`));
      }

      // ── Post-generation npm install ──
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
              pc.yellow(
                "npm install returned non-zero. You may need to install dependencies manually.",
              ),
            );
            resolve(); // Don't block on install failure
          }
        });
        install.on("error", () => {
          installSpinner.stop(
            pc.yellow("Could not run npm install automatically."),
          );
          resolve();
        });
      });

      p.outro(
        pc.cyan(
          `🎉 Successfully crafted ${pc.bold(answers.projectName)} using the ${pc.bold(answers.template)} template!`,
        ),
      );

      p.log.message(pc.white(`Next steps:`));
      p.log.step(pc.cyan(`$ cd ${answers.projectName}`));
      p.log.step(pc.cyan(`$ agentforge preview .`));
    } catch (err: unknown) {
      p.cancel(
        pc.red(
          `\n✖ Generation failed: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      process.exit(1);
    }
  }
}
