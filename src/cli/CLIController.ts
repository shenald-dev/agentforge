import inquirer from "inquirer";
import chalk from "chalk";
import { TemplateManager } from "../templates/TemplateManager";

export class CLIController {
    private templateManager: TemplateManager;

    constructor() {
        this.templateManager = new TemplateManager();
    }

    /**
     * Guides the user through an interactive setup process for generation.
     */
    async promptCreationDetails(defaultIdea: string) {
        console.log(chalk.cyan(`\n✨ AgentForge Interactive Scaffolding`));
        console.log(chalk.gray(`=====================================\n`));

        const templates = await this.templateManager.listTemplates();

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "projectName",
                message: "What is the name of your new application?",
                default: "my-vibe-app",
                validate: (input) => {
                    if (/^[a-z0-9-]+$/.test(input)) return true;
                    return "Project name may only include lowercase letters, numbers, and dashes.";
                }
            },
            {
                type: "input",
                name: "idea",
                message: "Describe your idea in one sentence:",
                default: defaultIdea || "A stunning new web app.",
            },
            {
                type: "list",
                name: "template",
                message: "Which scaffold template best fits your architecture?",
                choices: templates,
            }
        ]);

        return answers;
    }
}
