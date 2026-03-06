#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import { CLIController } from "./CLIController";
import { ProjectGenerator } from "../generators/ProjectGenerator";
import { TemplateManager } from "../templates/TemplateManager";
import { PreviewServer } from "../preview-server/PreviewServer";
import { LLMOptimizer } from "../integrations/LLMOptimizer";

const program = new Command();

program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version("1.0.0");

program
    .command("create [idea]")
    .description("Scaffold a new application.")
    .action(async (idea) => {
        const cli = new CLIController();
        const generator = new ProjectGenerator();
        const templateManager = new TemplateManager();
        const optimizer = new LLMOptimizer();

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

            // Optional post-generation step: Refine the README via LLM
            const fs = await import("fs/promises");
            const readmePath = path.join(outputPath, "README.md");
            try {
                const currentReadme = await fs.readFile(readmePath, "utf-8");
                const enhancedReadme = await optimizer.enhanceReadme(answers.idea, currentReadme);
                await fs.writeFile(readmePath, enhancedReadme, "utf-8");
            } catch (e) {
                // Silently skip if README doesn't exist or permissions fail
            }

            spinner.succeed(chalk.green(`✨ Successfully crafted ${answers.projectName} using the ${answers.template} template!`));

            console.log(`\nNext steps:`);
            console.log(chalk.cyan(`  $ cd ${answers.projectName}`));
            console.log(chalk.cyan(`  $ agentforge preview .`));

        } catch (err: any) {
            console.error(chalk.red(`\n✖ Generation failed: ${err.message}`));
        }
    });

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
